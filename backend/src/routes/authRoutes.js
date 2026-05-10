// ============================================================
//  src/routes/authRoutes.js — Authentication Routes
// ============================================================

const express    = require('express');
const router     = express.Router();
const { login, getMe, changePassword, createAdmin, getAllAdmins, toggleAdmin } = require('../controllers/authController');
const { protect, superAdminOnly } = require('../middleware/auth');

// Public routes
router.post('/login', login);

// Protected routes (any logged-in admin)
router.get('/me',              protect, getMe);
router.post('/change-password', protect, changePassword);

// Super admin only routes
router.post('/create-admin',         protect, superAdminOnly, createAdmin);
router.get('/admins',                protect, superAdminOnly, getAllAdmins);
router.patch('/admins/:id/toggle',   protect, superAdminOnly, toggleAdmin);

module.exports = router;