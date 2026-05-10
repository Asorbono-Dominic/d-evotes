// ============================================================
//  src/middleware/auth.js — JWT Authentication Middleware
// ============================================================

const { verifyToken, sendError } = require('../utils/helpers');
const { supabaseAdmin }          = require('../db/supabase');

// ---- Protect any route — must be logged in ----------------
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendError(res, 'Access denied. No token provided.', 401);
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        // Fetch admin from DB to make sure they still exist and are active
        const { data: admin, error } = await supabaseAdmin
            .from('admins')
            .select('id, username, email, role, is_active')
            .eq('id', decoded.id)
            .single();

        if (error || !admin) {
            return sendError(res, 'Admin account not found.', 401);
        }

        if (!admin.is_active) {
            return sendError(res, 'Your account has been deactivated.', 403);
        }

        req.admin = admin;
        next();

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return sendError(res, 'Session expired. Please login again.', 401);
        }
        return sendError(res, 'Invalid token.', 401);
    }
};

// ---- Super admin only -------------------------------------
const superAdminOnly = (req, res, next) => {
    if (req.admin?.role !== 'super_admin') {
        return sendError(res, 'Access denied. Super admin only.', 403);
    }
    next();
};

// ---- Election admin or super admin ------------------------
const electionAdminOrSuper = async (req, res, next) => {
    if (req.admin?.role === 'super_admin') return next();

    const electionId = req.params.electionId || req.body.election_id;

    if (!electionId) {
        return sendError(res, 'Election ID required.', 400);
    }

    // Check if this admin is assigned to this election
    const { data, error } = await supabaseAdmin
        .from('election_admins')
        .select('id')
        .eq('election_id', electionId)
        .eq('admin_id', req.admin.id)
        .single();

    if (error || !data) {
        return sendError(res, 'Access denied. You are not assigned to this election.', 403);
    }

    next();
};

module.exports = { protect, superAdminOnly, electionAdminOrSuper };