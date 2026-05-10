// ============================================================
//  src/routes/electionRoutes.js — Election Routes
// ============================================================

const express = require('express');
const router  = express.Router();
const {
    getPublicElections,
    getAllElections,
    getElection,
    createElection,
    updateElection,
    toggleElectionStatus,
    deleteElection,
    getElectionResults,
    assignAdmin,
} = require('../controllers/electionController');
const { protect, superAdminOnly, electionAdminOrSuper } = require('../middleware/auth');

// ---- PUBLIC ROUTES ----------------------------------------
router.get('/',                    getPublicElections);
router.get('/:id',                 getElection);
router.get('/:id/results',         getElectionResults);

// ---- ADMIN ROUTES -----------------------------------------
router.get('/admin/all',                        protect, getAllElections);
router.post('/',                                protect, createElection);
router.patch('/:id',                            protect, electionAdminOrSuper, updateElection);
router.patch('/:id/toggle-status',              protect, electionAdminOrSuper, toggleElectionStatus);
router.delete('/:id',                           protect, superAdminOnly, deleteElection);
router.post('/:id/assign-admin',                protect, superAdminOnly, assignAdmin);

module.exports = router;