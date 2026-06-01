// ============================================================
//  src/routes/exportRoutes.js
// ============================================================

const express = require('express');
const router  = express.Router();
const { exportExcel, exportPDF } = require('../controllers/exportController');
const { protect }                = require('../middleware/auth');

router.get('/:electionId/excel', protect, exportExcel);
router.get('/:electionId/pdf',   protect, exportPDF);

module.exports = router;