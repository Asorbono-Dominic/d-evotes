// ============================================================
//  src/controllers/candidateController.js
//  Manage positions and candidates per election
// ============================================================

const { supabaseAdmin }                          = require('../db/supabase');
const { sendSuccess, sendError, createAuditLog } = require('../utils/helpers');
const multer                                     = require('multer');
const path                                       = require('path');
const fs                                         = require('fs');

// ---- MULTER SETUP (photo uploads) -------------------------
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/candidates');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext      = path.extname(file.originalname).toLowerCase();
        const filename = `cand_${Date.now()}_${Math.floor(Math.random() * 9999)}${ext}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext     = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG, PNG and WEBP images are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3MB max
});

// Export the upload middleware for use in routes
const uploadPhoto = upload.single('photo');

// ============================================================
//  POSITIONS
// ============================================================

// ---- GET /api/candidates/positions/:electionId ------------
const getPositions = async (req, res) => {
    const { electionId } = req.params;

    const { data: positions, error } = await supabaseAdmin
        .from('positions')
        .select(`
            id, title, description, display_order,
            candidates (
                id, full_name, bio, photo_url, display_order
            )
        `)
        .eq('election_id', electionId)
        .order('display_order', { ascending: true });

    if (error) return sendError(res, 'Failed to fetch positions.', 500);

    return sendSuccess(res, { positions });
};

// ---- POST /api/candidates/positions (admin) ---------------
const createPosition = async (req, res) => {
    const { election_id, title, description, display_order } = req.body;

    if (!election_id || !title) {
        return sendError(res, 'election_id and title are required.', 400);
    }

    const { data: position, error } = await supabaseAdmin
        .from('positions')
        .insert({
            election_id,
            title:         title.trim(),
            description:   description   || null,
            display_order: display_order || 0,
        })
        .select()
        .single();

    if (error) return sendError(res, 'Failed to create position.', 500);

    await createAuditLog(supabaseAdmin, {
        adminId:    req.admin.id,
        adminName:  req.admin.username,
        electionId: election_id,
        action:     'position_created',
        details:    { title },
        ipAddress:  req.ip,
    });

    return sendSuccess(res, { position }, 'Position created successfully', 201);
};

// ---- PATCH /api/candidates/positions/:id (admin) ----------
const updatePosition = async (req, res) => {
    const { id }                              = req.params;
    const { title, description, display_order } = req.body;

    const { data: position, error } = await supabaseAdmin
        .from('positions')
        .update({ title, description, display_order })
        .eq('id', id)
        .select()
        .single();

    if (error) return sendError(res, 'Failed to update position.', 500);

    return sendSuccess(res, { position }, 'Position updated successfully');
};

// ---- DELETE /api/candidates/positions/:id (admin) ---------
const deletePosition = async (req, res) => {
    const { id } = req.params;

    // Check if any votes exist for candidates in this position
    const { count } = await supabaseAdmin
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('position_id', id);

    if (count > 0) {
        return sendError(res, 'Cannot delete — votes have been cast for candidates in this position.', 400);
    }

    await supabaseAdmin.from('positions').delete().eq('id', id);

    return sendSuccess(res, null, 'Position deleted successfully');
};

// ============================================================
//  CANDIDATES
// ============================================================

// ---- GET /api/candidates/:electionId ----------------------
const getCandidates = async (req, res) => {
    const { electionId } = req.params;

    const { data: candidates, error } = await supabaseAdmin
        .from('candidates')
        .select(`
            id, full_name, bio, photo_url, display_order,
            position_id,
            positions ( id, title )
        `)
        .eq('election_id', electionId)
        .order('display_order', { ascending: true });

    if (error) return sendError(res, 'Failed to fetch candidates.', 500);

    return sendSuccess(res, { candidates });
};

// ---- POST /api/candidates (admin) -------------------------
const createCandidate = async (req, res) => {
    const { election_id, position_id, full_name, bio, display_order } = req.body;

    if (!election_id || !position_id || !full_name) {
        return sendError(res, 'election_id, position_id and full_name are required.', 400);
    }

    // Handle photo upload
    let photo_url = '/default-avatar.png';
    if (req.file) {
        photo_url = `/uploads/candidates/${req.file.filename}`;
    }

    const { data: candidate, error } = await supabaseAdmin
        .from('candidates')
        .insert({
            election_id,
            position_id,
            full_name:     full_name.trim(),
            bio:           bio           || null,
            photo_url,
            display_order: display_order || 0,
        })
        .select()
        .single();

    if (error) return sendError(res, 'Failed to create candidate.', 500);

    await createAuditLog(supabaseAdmin, {
        adminId:    req.admin.id,
        adminName:  req.admin.username,
        electionId: election_id,
        action:     'candidate_created',
        details:    { full_name, position_id },
        ipAddress:  req.ip,
    });

    return sendSuccess(res, { candidate }, 'Candidate created successfully', 201);
};

// ---- PATCH /api/candidates/:id (admin) --------------------
const updateCandidate = async (req, res) => {
    const { id }                                          = req.params;
    const { full_name, bio, position_id, display_order } = req.body;

    // Get existing candidate to handle old photo deletion
    const { data: existing } = await supabaseAdmin
        .from('candidates')
        .select('photo_url')
        .eq('id', id)
        .single();

    let photo_url = existing?.photo_url;

    // Handle new photo upload
    if (req.file) {
        photo_url = `/uploads/candidates/${req.file.filename}`;

        // Delete old photo file if it's not the default
        if (existing?.photo_url && !existing.photo_url.includes('default-avatar')) {
            const oldPath = path.join(__dirname, '../../', existing.photo_url);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
    }

    const { data: candidate, error } = await supabaseAdmin
        .from('candidates')
        .update({ full_name, bio, position_id, photo_url, display_order })
        .eq('id', id)
        .select()
        .single();

    if (error) return sendError(res, 'Failed to update candidate.', 500);

    return sendSuccess(res, { candidate }, 'Candidate updated successfully');
};

// ---- DELETE /api/candidates/:id (admin) -------------------
const deleteCandidate = async (req, res) => {
    const { id } = req.params;

    // Check if any votes exist for this candidate
    const { count } = await supabaseAdmin
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('candidate_id', id);

    if (count > 0) {
        return sendError(res, 'Cannot delete — votes have been cast for this candidate.', 400);
    }

    // Get photo to delete file
    const { data: candidate } = await supabaseAdmin
        .from('candidates')
        .select('photo_url, election_id, full_name')
        .eq('id', id)
        .single();

    if (!candidate) return sendError(res, 'Candidate not found.', 404);

    // Delete photo file
    if (candidate.photo_url && !candidate.photo_url.includes('default-avatar')) {
        const filePath = path.join(__dirname, '../../', candidate.photo_url);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await supabaseAdmin.from('candidates').delete().eq('id', id);

    await createAuditLog(supabaseAdmin, {
        adminId:    req.admin.id,
        adminName:  req.admin.username,
        electionId: candidate.election_id,
        action:     'candidate_deleted',
        details:    { full_name: candidate.full_name },
        ipAddress:  req.ip,
    });

    return sendSuccess(res, null, 'Candidate deleted successfully');
};

module.exports = {
    uploadPhoto,
    getPositions,
    createPosition,
    updatePosition,
    deletePosition,
    getCandidates,
    createCandidate,
    updateCandidate,
    deleteCandidate,
};