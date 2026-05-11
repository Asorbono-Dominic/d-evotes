// ============================================================
//  src/controllers/voterController.js
//  Voter registration, OTP generation, Excel bulk upload
// ============================================================

const { supabaseAdmin }                                              = require('../db/supabase');
const { sendSuccess, sendError, generateOTP, createAuditLog, validateVoterIdFormat } = require('../utils/helpers');
const multer                                                         = require('multer');
const XLSX                                                           = require('xlsx');
const path                                                           = require('path');
const fs                                                             = require('fs');

// ---- MULTER FOR EXCEL UPLOADS -----------------------------
const excelStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../uploads/excel');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `voters_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const excelFilter = (req, file, cb) => {
    const allowed = ['.xlsx', '.xls', '.csv'];
    const ext     = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only Excel (.xlsx, .xls) or CSV files are allowed.'), false);
    }
};

const uploadExcel = multer({
    storage:    excelStorage,
    fileFilter: excelFilter,
    limits:     { fileSize: 10 * 1024 * 1024 }, // 10MB max
}).single('voters_file');

// ============================================================
//  VOTER ROUTES
// ============================================================

// ---- GET /api/voters/:electionId (admin) ------------------
const getVoters = async (req, res) => {
    const { electionId } = req.params;
    const { search, page = 1, limit = 50 } = req.query;

    let query = supabaseAdmin
        .from('voters')
        .select('*', { count: 'exact' })
        .eq('election_id', electionId)
        .order('created_at', { ascending: false });

    if (search) {
        query = query.or(`voter_id.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to   = from + parseInt(limit) - 1;
    query      = query.range(from, to);

    const { data: voters, count, error } = await query;
    if (error) return sendError(res, 'Failed to fetch voters.', 500);

    // Stats
    const { count: votedCount } = await supabaseAdmin
        .from('voters')
        .select('*', { count: 'exact', head: true })
        .eq('election_id', electionId)
        .eq('has_voted', true);

    const { count: otpCount } = await supabaseAdmin
        .from('voters')
        .select('*', { count: 'exact', head: true })
        .eq('election_id', electionId)
        .eq('otp_generated', true);

    return sendSuccess(res, {
        voters,
        pagination: {
            total: count,
            page:  parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit),
        },
        stats: {
            total:         count     || 0,
            voted:         votedCount || 0,
            otp_generated: otpCount  || 0,
            not_started:   (count || 0) - (otpCount || 0),
        }
    });
};

// ---- POST /api/voters/single (admin) ----------------------
// Add a single voter
const addSingleVoter = async (req, res) => {
    const { election_id, voter_id, full_name } = req.body;

    if (!election_id || !voter_id) {
        return sendError(res, 'election_id and voter_id are required.', 400);
    }

    // Get election to check voter ID format
    const { data: election } = await supabaseAdmin
        .from('elections')
        .select('voter_id_format')
        .eq('id', election_id)
        .single();

    // Validate format
    if (election?.voter_id_format && election.voter_id_format !== 'ANY') {
        const valid = validateVoterIdFormat(voter_id.toUpperCase(), election.voter_id_format);
        if (!valid) {
            return sendError(res,
                `Invalid voter ID format. Expected format: ${election.voter_id_format}`, 400);
        }
    }

    const { data: voter, error } = await supabaseAdmin
        .from('voters')
        .insert({
            election_id,
            voter_id:  voter_id.trim().toUpperCase(),
            full_name: full_name?.trim() || null,
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            return sendError(res, 'This voter ID is already registered for this election.', 409);
        }
        return sendError(res, 'Failed to add voter.', 500);
    }

    await createAuditLog(supabaseAdmin, {
        adminId:    req.admin.id,
        adminName:  req.admin.username,
        electionId: election_id,
        action:     'voter_added',
        details:    { voter_id },
        ipAddress:  req.ip,
    });

    return sendSuccess(res, { voter }, 'Voter added successfully', 201);
};

// ---- POST /api/voters/bulk-excel (admin) ------------------
// Upload Excel file with voter IDs
const bulkUploadExcel = async (req, res) => {
    if (!req.file) {
        return sendError(res, 'Please upload an Excel or CSV file.', 400);
    }

    const { election_id } = req.body;
    if (!election_id) {
        return sendError(res, 'election_id is required.', 400);
    }

    // Get election voter ID format
    const { data: election } = await supabaseAdmin
        .from('elections')
        .select('voter_id_format, title')
        .eq('id', election_id)
        .single();

    if (!election) return sendError(res, 'Election not found.', 404);

    try {
        // Read the Excel file
        const workbook  = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet     = workbook.Sheets[sheetName];
        const rows      = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rows.length === 0) {
            return sendError(res, 'The file is empty or has no data rows.', 400);
        }

        if (rows.length > 5000) {
            return sendError(res, 'Maximum 5000 voters per upload.', 400);
        }

        // ⚠️  EXPECTED EXCEL FORMAT:
        // Column A: voter_id   (required) — e.g. STU001 or GH27554657
        // Column B: full_name  (optional) — e.g. Kwame Asante
        // First row should be headers: voter_id, full_name

        const toInsert  = [];
        const errors    = [];
        const skipped   = [];

        for (let i = 0; i < rows.length; i++) {
            const row      = rows[i];
            const rowNum   = i + 2; // +2 because row 1 is header

            // Support multiple possible column name formats
            const voter_id  = (
                row['voter_id']  ||
                row['Voter ID']  ||
                row['VOTER_ID']  ||
                row['ID']        ||
                row['id']        ||
                ''
            ).toString().trim().toUpperCase();

            const full_name = (
                row['full_name'] ||
                row['Full Name'] ||
                row['FULL_NAME'] ||
                row['Name']      ||
                row['name']      ||
                ''
            ).toString().trim();

            if (!voter_id) {
                errors.push(`Row ${rowNum}: Missing voter ID`);
                continue;
            }

            // Validate format
            if (election.voter_id_format && election.voter_id_format !== 'ANY') {
                const valid = validateVoterIdFormat(voter_id, election.voter_id_format);
                if (!valid) {
                    errors.push(`Row ${rowNum}: "${voter_id}" doesn't match format ${election.voter_id_format}`);
                    continue;
                }
            }

            toInsert.push({
                election_id,
                voter_id,
                full_name: full_name || null,
            });
        }

        // Insert in batches of 500
        let added = 0;
        const batchSize = 500;

        for (let i = 0; i < toInsert.length; i += batchSize) {
            const batch = toInsert.slice(i, i + batchSize);
            const { data, error } = await supabaseAdmin
                .from('voters')
                .upsert(batch, {
                    onConflict:        'election_id,voter_id',
                    ignoreDuplicates:  true,
                })
                .select();

            if (!error && data) added += data.length;
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        await createAuditLog(supabaseAdmin, {
            adminId:    req.admin.id,
            adminName:  req.admin.username,
            electionId: election_id,
            action:     'voters_bulk_uploaded',
            details:    { total_rows: rows.length, added, errors: errors.length },
            ipAddress:  req.ip,
        });

        return sendSuccess(res, {
            total_rows: rows.length,
            added,
            skipped:    rows.length - toInsert.length,
            errors:     errors.slice(0, 20), // Return first 20 errors only
        }, `Bulk upload complete: ${added} voters added`);

    } catch (err) {
        // Clean up file on error
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return sendError(res, `Failed to process file: ${err.message}`, 500);
    }
};

// ---- POST /api/voters/generate-otp (public) ---------------
// Voter enters their ID to get an OTP
const generateOTPForVoter = async (req, res) => {
    const { election_id, voter_id } = req.body;

    if (!election_id || !voter_id) {
        return sendError(res, 'election_id and voter_id are required.', 400);
    }

    // Check election is open
    const { data: election } = await supabaseAdmin
        .from('elections')
        .select('status, title')
        .eq('id', election_id)
        .single();

    if (!election) return sendError(res, 'Election not found.', 404);
    if (election.status !== 'open') {
        return sendError(res, 'This election is not currently open for voting.', 403);
    }

    // Find voter
    const { data: voter } = await supabaseAdmin
        .from('voters')
        .select('*')
        .eq('election_id', election_id)
        .eq('voter_id', voter_id.trim().toUpperCase())
        .single();

    if (!voter) {
        return sendError(res, 'Voter ID not found. Please contact the Electoral Commission.', 404);
    }

    if (voter.otp_generated) {
        return sendError(res, 'An OTP has already been generated for this ID. Each ID can only request one OTP.', 400);
    }

    if (voter.has_voted) {
        return sendError(res, 'This voter ID has already been used to vote.', 400);
    }

    // Generate OTP
    const otp        = generateOTP();
    const otp_expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await supabaseAdmin
        .from('voters')
        .update({
            otp,
            otp_generated:  true,
            otp_expires_at: otp_expiry,
        })
        .eq('id', voter.id);

    return sendSuccess(res, {
        otp,
        voter_name:  voter.full_name || null,
        expires_at:  otp_expiry,
        election:    election.title,
    }, 'OTP generated successfully');
};

// ---- POST /api/voters/login (public) ----------------------
// Voter logs in with their ID + OTP
const voterLogin = async (req, res) => {
    const { election_id, voter_id, otp } = req.body;

    if (!election_id || !voter_id || !otp) {
        return sendError(res, 'election_id, voter_id and otp are required.', 400);
    }

    const { data: voter } = await supabaseAdmin
        .from('voters')
        .select('*')
        .eq('election_id', election_id)
        .eq('voter_id', voter_id.trim().toUpperCase())
        .single();

    if (!voter) return sendError(res, 'Invalid voter ID or OTP.', 401);

    if (!voter.otp_generated || !voter.otp) {
        return sendError(res, 'No OTP has been generated for this ID. Please generate one first.', 400);
    }

    if (voter.otp !== otp.trim().toUpperCase()) {
        return sendError(res, 'Invalid OTP. Please check and try again.', 401);
    }

    // Check OTP expiry
    if (voter.otp_expires_at && new Date(voter.otp_expires_at) < new Date()) {
        return sendError(res, 'Your OTP has expired. Please contact the Electoral Commission.', 401);
    }

    if (voter.has_voted) {
        return sendError(res, 'This voter ID has already been used to vote.', 400);
    }

    // Generate voter JWT token (short-lived — 2 hours)
    const jwt     = require('jsonwebtoken');
    const token   = jwt.sign(
        {
            voter_id:    voter.voter_id,
            election_id: voter.election_id,
            voter_uuid:  voter.id,
            type:        'voter',
        },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
    );

    return sendSuccess(res, {
        token,
        voter: {
            voter_id:   voter.voter_id,
            full_name:  voter.full_name,
            election_id: voter.election_id,
        }
    }, 'Login successful');
};

// ---- DELETE /api/voters/:id (admin) -----------------------
const deleteVoter = async (req, res) => {
    const { id } = req.params;

    const { data: voter } = await supabaseAdmin
        .from('voters')
        .select('voter_id, election_id, has_voted')
        .eq('id', id)
        .single();

    if (!voter) return sendError(res, 'Voter not found.', 404);

    if (voter.has_voted) {
        return sendError(res, 'Cannot delete a voter who has already voted.', 400);
    }

    await supabaseAdmin.from('voters').delete().eq('id', id);

    return sendSuccess(res, null, 'Voter removed successfully');
};

// ---- PATCH /api/voters/:id/reset-otp (admin) --------------
const resetOTP = async (req, res) => {
    const { id } = req.params;

    await supabaseAdmin
        .from('voters')
        .update({
            otp:            null,
            otp_generated:  false,
            otp_expires_at: null,
        })
        .eq('id', id);

    await createAuditLog(supabaseAdmin, {
        adminId:   req.admin.id,
        adminName: req.admin.username,
        action:    'voter_otp_reset',
        details:   { voter_uuid: id },
        ipAddress: req.ip,
    });

    return sendSuccess(res, null, 'OTP reset successfully. Voter can now generate a new OTP.');
};

// ---- PATCH /api/voters/:id/reset-vote (admin) -------------
// Emergency: allow voter to vote again
const resetVote = async (req, res) => {
    const { id } = req.params;

    const { data: voter } = await supabaseAdmin
        .from('voters')
        .select('voter_id, election_id')
        .eq('id', id)
        .single();

    if (!voter) return sendError(res, 'Voter not found.', 404);

    // Delete their votes
    await supabaseAdmin
        .from('votes')
        .delete()
        .eq('election_id', voter.election_id)
        .eq('voter_id', voter.voter_id);

    // Reset voter record
    await supabaseAdmin
        .from('voters')
        .update({
            has_voted:      false,
            voted_at:       null,
            otp:            null,
            otp_generated:  false,
            otp_expires_at: null,
        })
        .eq('id', id);

    await createAuditLog(supabaseAdmin, {
        adminId:   req.admin.id,
        adminName: req.admin.username,
        action:    'voter_vote_reset',
        details:   { voter_id: voter.voter_id },
        ipAddress: req.ip,
    });

    return sendSuccess(res, null, '⚠️ Vote reset successfully. Voter can now vote again.');
};

// ---- GET /api/voters/:electionId/download-template --------
// Download Excel template for bulk upload
const downloadTemplate = async (req, res) => {
    const { electionId } = req.params;

    const { data: election } = await supabaseAdmin
        .from('elections')
        .select('title, voter_id_format')
        .eq('id', electionId)
        .single();

    // Create a sample workbook
    const wb = XLSX.utils.book_new();
    const sampleData = [
        { voter_id: 'STU001',    full_name: 'Kwame Asante'   },
        { voter_id: 'STU002',    full_name: 'Abena Mensah'   },
        { voter_id: 'STU003',    full_name: 'Kofi Boateng'   },
    ];

    // If there's a specific format, show example
    if (election?.voter_id_format && election.voter_id_format !== 'ANY') {
        sampleData[0].voter_id = election.voter_id_format.replace(/[A-Z]/g, 'X').replace(/[0-9]/g, '0');
    }

    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, 'Voters');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="voters_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
};

module.exports = {
    uploadExcel,
    getVoters,
    addSingleVoter,
    bulkUploadExcel,
    generateOTPForVoter,
    voterLogin,
    deleteVoter,
    resetOTP,
    resetVote,
    downloadTemplate,
};