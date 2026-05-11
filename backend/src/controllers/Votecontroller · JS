// ============================================================
//  src/controllers/voteController.js — Cast votes
// ============================================================

const { supabaseAdmin }                          = require('../db/supabase');
const { sendSuccess, sendError, createAuditLog } = require('../utils/helpers');
const jwt                                        = require('jsonwebtoken');

// ---- Verify voter token middleware ------------------------
const verifyVoterToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return sendError(res, 'Access denied. Please login first.', 401);
    }

    try {
        const token   = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== 'voter') {
            return sendError(res, 'Invalid token type.', 401);
        }

        req.voter = decoded;
        next();
    } catch {
        return sendError(res, 'Invalid or expired session. Please login again.', 401);
    }
};

// ---- POST /api/votes/cast ---------------------------------
const castVote = async (req, res) => {
    const { election_id, votes } = req.body;
    // votes = [{ position_id, candidate_id }, ...]

    if (!election_id || !votes || !Array.isArray(votes) || votes.length === 0) {
        return sendError(res, 'election_id and votes array are required.', 400);
    }

    const voter_id  = req.voter.voter_id;
    const voter_uuid = req.voter.voter_uuid;

    // Verify election is still open
    const { data: election } = await supabaseAdmin
        .from('elections')
        .select('status')
        .eq('id', election_id)
        .single();

    if (!election || election.status !== 'open') {
        return sendError(res, 'This election is not currently open for voting.', 403);
    }

    // Check voter hasn't already voted
    const { data: voter } = await supabaseAdmin
        .from('voters')
        .select('has_voted')
        .eq('id', voter_uuid)
        .single();

    if (!voter) return sendError(res, 'Voter not found.', 404);
    if (voter.has_voted) return sendError(res, 'You have already cast your vote.', 400);

    // Get all positions for this election
    const { data: positions } = await supabaseAdmin
        .from('positions')
        .select('id')
        .eq('election_id', election_id);

    const positionIds = positions.map(p => p.id);

    // Validate all positions are covered
    const votedPositionIds = votes.map(v => v.position_id);
    const missingPositions = positionIds.filter(id => !votedPositionIds.includes(id));

    if (missingPositions.length > 0) {
        return sendError(res, 'Please select a candidate for every position.', 400);
    }

    // Validate each candidate belongs to the correct position
    for (const vote of votes) {
        const { data: candidate } = await supabaseAdmin
            .from('candidates')
            .select('id')
            .eq('id', vote.candidate_id)
            .eq('position_id', vote.position_id)
            .eq('election_id', election_id)
            .single();

        if (!candidate) {
            return sendError(res, 'Invalid candidate selection detected.', 400);
        }
    }

    // Insert all votes
    const voteRecords = votes.map(v => ({
        election_id,
        voter_id,
        position_id:  v.position_id,
        candidate_id: v.candidate_id,
    }));

    const { error: voteError } = await supabaseAdmin
        .from('votes')
        .insert(voteRecords);

    if (voteError) return sendError(res, 'Failed to record votes. Please try again.', 500);

    // Mark voter as having voted
    await supabaseAdmin
        .from('voters')
        .update({
            has_voted: true,
            voted_at:  new Date(),
            otp:       null, // Invalidate OTP after voting
        })
        .eq('id', voter_uuid);

    await createAuditLog(supabaseAdmin, {
        electionId: election_id,
        action:     'vote_cast',
        details:    { voter_id, positions_voted: votes.length },
    });

    return sendSuccess(res, {
        confirmation_code: `VOTE-${Date.now().toString(36).toUpperCase()}`,
        voted_at:          new Date(),
        positions_voted:   votes.length,
    }, '🗳️ Your vote has been recorded successfully!');
};

// ---- GET /api/votes/audit/:electionId (admin) -------------
const getAuditLogs = async (req, res) => {
    const { electionId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const from = (page - 1) * limit;
    const to   = from + parseInt(limit) - 1;

    const { data: logs, count, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('election_id', electionId)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) return sendError(res, 'Failed to fetch audit logs.', 500);

    return sendSuccess(res, {
        logs,
        pagination: {
            total: count,
            page:  parseInt(page),
            limit: parseInt(limit),
        }
    });
};

// ---- GET /api/votes/audit/all (super admin) ---------------
const getAllAuditLogs = async (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    const from = (page - 1) * limit;
    const to   = from + parseInt(limit) - 1;

    const { data: logs, count } = await supabaseAdmin
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    return sendSuccess(res, {
        logs,
        pagination: { total: count, page: parseInt(page), limit: parseInt(limit) }
    });
};

module.exports = { verifyVoterToken, castVote, getAuditLogs, getAllAuditLogs };