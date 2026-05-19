const express = require('express');
const {
  getAllStaff,
  getDoctors,
  updateStaff,
  deleteStaff,
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Doctors list - sabko chahiye (booking ke liye)
router.get('/doctors', protect, getDoctors);

// Admin-only operations
router.get('/', protect, authorize('admin'), getAllStaff);
router.put('/:id', protect, authorize('admin'), updateStaff);
router.delete('/:id', protect, authorize('admin'), deleteStaff);

module.exports = router;
