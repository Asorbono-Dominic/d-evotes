// ============================================================
//  src/routes/candidateRoutes.js
// ============================================================

const express = require('express');
const router  = express.Router();
const {
    uploadPhoto,
    getPositions,
    createPosition,
    updatePosition,
    deletePosition,
    getCandidates,
    createCandidate,
    updateCandidate,
    deleteCandidate,
} = require('../controllers/candidateController');
const { protect, electionAdminOrSuper } = require('../middleware/auth');

// ---- POSITIONS --------------------------------------------
router.get('/positions/:electionId',  getPositions);
router.post('/positions',             protect, createPosition);
router.patch('/positions/:id',        protect, updatePosition);
router.delete('/positions/:id',       protect, deletePosition);

// ---- CANDIDATES -------------------------------------------
router.get('/:electionId',            getCandidates);
router.post('/',                      protect, uploadPhoto, createCandidate);
router.patch('/:id',                  protect, uploadPhoto, updateCandidate);
router.delete('/:id',                 protect, deleteCandidate);

module.exports = router;