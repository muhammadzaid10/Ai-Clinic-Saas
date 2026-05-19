const express = require('express');
const {
  createAppointment,
  getAppointments,
  updateAppointment,
  deleteAppointment,
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .get(protect, getAppointments)
  .post(
    protect,
    authorize('admin', 'receptionist', 'doctor', 'patient'),
    createAppointment
  );

router
  .route('/:id')
  .put(protect, authorize('admin', 'receptionist', 'doctor'), updateAppointment)
  .delete(
    protect,
    authorize('admin', 'receptionist', 'patient'),
    deleteAppointment
  );

module.exports = router;
