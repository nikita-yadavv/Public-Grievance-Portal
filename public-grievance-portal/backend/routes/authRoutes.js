const express = require('express');
const router = express.Router();
const {
  register, login, getMe, updateProfile,
  getOfficers, approveOfficer, deleteOfficer, verifyEmail
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Chief Officer only
router.get('/officers', protect, authorize('superadmin'), getOfficers);
router.patch('/officers/:id/approve', protect, authorize('superadmin'), approveOfficer);
router.delete('/officers/:id', protect, authorize('superadmin'), deleteOfficer);

module.exports = router;
