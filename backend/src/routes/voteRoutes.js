// ============================================================
//  src/routes/voteRoutes.js
// ============================================================

const express = require('express');
const router  = express.Router();
const { verifyVoterToken, castVote, getAuditLogs, getAllAuditLogs } = require('../controllers/voteController');
const { protect, superAdminOnly } = require('../middleware/auth');

// ---- VOTER ROUTES -----------------------------------------
router.post('/cast', verifyVoterToken, castVote);

// ---- ADMIN ROUTES -----------------------------------------
router.get('/audit/:electionId', protect, getAuditLogs);
router.get('/audit/all',         protect, superAdminOnly, getAllAuditLogs);

module.exports = router;