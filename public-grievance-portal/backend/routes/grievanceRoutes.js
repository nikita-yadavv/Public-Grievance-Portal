const express = require('express');
const router = express.Router();
const {
  createGrievance, getMyGrievances, getAllGrievances,
  getGrievanceById, updateGrievanceStatus, getGrievanceStats
} = require('../controllers/grievanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Citizen routes
router.post('/', protect, createGrievance);
router.get('/my', protect, getMyGrievances);

// Admin routes
router.get('/stats', protect, authorize('admin'), getGrievanceStats);
router.get('/', protect, authorize('admin'), getAllGrievances);
router.patch('/:id/status', protect, authorize('admin'), updateGrievanceStatus);

// Shared
router.get('/:id', protect, getGrievanceById);

module.exports = router;
