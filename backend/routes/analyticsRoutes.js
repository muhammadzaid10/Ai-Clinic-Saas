const express = require('express');
const {
  getAdminAnalytics,
  getDoctorAnalytics,
  updateSubscription,
  getSubscriptions,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/admin', protect, authorize('admin'), getAdminAnalytics);
router.get('/doctor', protect, authorize('doctor'), getDoctorAnalytics);
router.get('/subscriptions', protect, authorize('admin'), getSubscriptions);
router.put('/subscription/:userId', protect, authorize('admin'), updateSubscription);

module.exports = router;
