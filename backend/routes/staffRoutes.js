const express = require('express');
const {
  getAllStaff,
  getDoctors,
  updateStaff,
  deleteStaff,
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User'); // <-- User model ko import kiya

const router = express.Router();

// 🔥 Custom Middleware: Jo check karega ki target user Admin toh nahi hai
const preventAdminModification = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) {
      return res.status(404).json({ message: "Staff member nahi mila." });
    }

    // 🛑 STRICT CHECK: Agar target user ka role 'admin' hai, toh action block kar do
    if (targetUser.role === 'admin') {
      return res.status(403).json({ 
        message: "❌ You cannot modify an admin account." 
      });
    }

    next(); // Agar admin nahi hai, toh controller par jaane dein
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Doctors list - sabko chahiye (booking ke liye)
router.get('/doctors', protect, getDoctors);

// Admin-only operations
router.get('/', protect, authorize('admin'), getAllStaff);

// 🔥 Put (Deactivate/Update) aur Delete par protection laga di
router.put('/:id', protect, authorize('admin'), preventAdminModification, updateStaff);
router.delete('/:id', protect, authorize('admin'), preventAdminModification, deleteStaff);

module.exports = router;