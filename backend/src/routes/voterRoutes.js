// ============================================================
//  src/routes/voterRoutes.js
// ============================================================

const express = require('express');
const router  = express.Router();
const {
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
} = require('../controllers/voterController');
const { protect } = require('../middleware/auth');

// ---- PUBLIC ROUTES ----------------------------------------
router.post('/generate-otp', generateOTPForVoter);
router.post('/login',        voterLogin);

// ---- ADMIN ROUTES -----------------------------------------
router.get('/:electionId',                    protect, getVoters);
router.get('/:electionId/download-template',  protect, downloadTemplate);
router.post('/single',                        protect, addSingleVoter);
router.post('/bulk-excel',                    protect, uploadExcel, bulkUploadExcel);
router.delete('/:id',                         protect, deleteVoter);
router.patch('/:id/reset-otp',                protect, resetOTP);
router.patch('/:id/reset-vote',               protect, resetVote);

module.exports = router;