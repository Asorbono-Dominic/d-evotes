// ============================================================
//  src/controllers/authController.js — Admin Authentication
// ============================================================

const bcrypt                                       = require('bcryptjs');
const { supabaseAdmin }                            = require('../db/supabase');
const { generateToken, sendSuccess, sendError, createAuditLog } = require('../utils/helpers');

// ---- POST /api/auth/login ---------------------------------
const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return sendError(res, 'Username and password are required.', 400);
    }

    // Find admin by username
    const { data: admin, error } = await supabaseAdmin
        .from('admins')
        .select('*')
        .eq('username', username.trim().toLowerCase())
        .single();

    if (error || !admin) {
        return sendError(res, 'Invalid username or password.', 401);
    }

    if (!admin.is_active) {
        return sendError(res, 'Your account has been deactivated. Contact the super admin.', 403);
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
        return sendError(res, 'Invalid username or password.', 401);
    }

    // Generate JWT
    const token = generateToken({
        id:       admin.id,
        username: admin.username,
        role:     admin.role,
    });

    // Log the action
    await createAuditLog(supabaseAdmin, {
        adminId:   admin.id,
        adminName: admin.username,
        action:    'admin_login',
        details:   { username: admin.username, role: admin.role },
        ipAddress: req.ip,
    });

    return sendSuccess(res, {
        token,
        admin: {
            id:       admin.id,
            username: admin.username,
            email:    admin.email,
            role:     admin.role,
        }
    }, 'Login successful');
};

// ---- GET /api/auth/me -------------------------------------
const getMe = async (req, res) => {
    return sendSuccess(res, {
        admin: req.admin
    }, 'Admin profile fetched');
};

// ---- POST /api/auth/change-password -----------------------
const changePassword = async (req, res) => {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
        return sendError(res, 'Current and new passwords are required.', 400);
    }

    if (new_password.length < 8) {
        return sendError(res, 'New password must be at least 8 characters.', 400);
    }

    // Get full admin record
    const { data: admin } = await supabaseAdmin
        .from('admins')
        .select('*')
        .eq('id', req.admin.id)
        .single();

    const isMatch = await bcrypt.compare(current_password, admin.password_hash);
    if (!isMatch) {
        return sendError(res, 'Current password is incorrect.', 400);
    }

    const newHash = await bcrypt.hash(new_password, 10);

    await supabaseAdmin
        .from('admins')
        .update({ password_hash: newHash, updated_at: new Date() })
        .eq('id', req.admin.id);

    await createAuditLog(supabaseAdmin, {
        adminId:   req.admin.id,
        adminName: req.admin.username,
        action:    'password_changed',
        ipAddress: req.ip,
    });

    return sendSuccess(res, null, 'Password changed successfully');
};

// ---- POST /api/auth/create-admin (super admin only) -------
const createAdmin = async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
        return sendError(res, 'Username, email and password are required.', 400);
    }

    if (!['super_admin', 'election_admin'].includes(role)) {
        return sendError(res, 'Invalid role. Must be super_admin or election_admin.', 400);
    }

    // Check if username or email already exists
    const { data: existing } = await supabaseAdmin
        .from('admins')
        .select('id')
        .or(`username.eq.${username},email.eq.${email}`)
        .single();

    if (existing) {
        return sendError(res, 'Username or email already exists.', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data: newAdmin, error } = await supabaseAdmin
        .from('admins')
        .insert({
            username:      username.trim().toLowerCase(),
            email:         email.trim().toLowerCase(),
            password_hash: passwordHash,
            role:          role || 'election_admin',
        })
        .select('id, username, email, role, is_active, created_at')
        .single();

    if (error) {
        return sendError(res, 'Failed to create admin.', 500);
    }

    await createAuditLog(supabaseAdmin, {
        adminId:   req.admin.id,
        adminName: req.admin.username,
        action:    'admin_created',
        details:   { new_admin: username, role },
        ipAddress: req.ip,
    });

    return sendSuccess(res, { admin: newAdmin }, 'Admin created successfully', 201);
};

// ---- GET /api/auth/admins (super admin only) --------------
const getAllAdmins = async (req, res) => {
    const { data: admins, error } = await supabaseAdmin
        .from('admins')
        .select('id, username, email, role, is_active, created_at')
        .order('created_at', { ascending: false });

    if (error) return sendError(res, 'Failed to fetch admins.', 500);

    return sendSuccess(res, { admins });
};

// ---- PATCH /api/auth/admins/:id/toggle (super admin only) -
const toggleAdmin = async (req, res) => {
    const { id } = req.params;

    // Prevent super admin from deactivating themselves
    if (id === req.admin.id) {
        return sendError(res, 'You cannot deactivate your own account.', 400);
    }

    const { data: admin } = await supabaseAdmin
        .from('admins')
        .select('is_active, username')
        .eq('id', id)
        .single();

    if (!admin) return sendError(res, 'Admin not found.', 404);

    const { data: updated } = await supabaseAdmin
        .from('admins')
        .update({ is_active: !admin.is_active, updated_at: new Date() })
        .eq('id', id)
        .select('id, username, is_active')
        .single();

    await createAuditLog(supabaseAdmin, {
        adminId:   req.admin.id,
        adminName: req.admin.username,
        action:    admin.is_active ? 'admin_deactivated' : 'admin_activated',
        details:   { target_admin: admin.username },
        ipAddress: req.ip,
    });

    return sendSuccess(res, { admin: updated },
        `Admin ${updated.is_active ? 'activated' : 'deactivated'} successfully`);
};

module.exports = { login, getMe, changePassword, createAdmin, getAllAdmins, toggleAdmin };