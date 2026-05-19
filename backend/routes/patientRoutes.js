const express = require('express');
const {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  getMyProfile,
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Patient self-profile (patient role)
router.get('/me/profile', protect, authorize('patient'), getMyProfile);

router
  .route('/')
  .get(protect, authorize('admin', 'receptionist', 'doctor'), getPatients)
  .post(protect, authorize('admin', 'receptionist', 'doctor'), createPatient);

router
  .route('/:id')
  .get(protect, authorize('admin', 'receptionist', 'doctor', 'patient'), getPatientById)
  .put(protect, authorize('admin', 'receptionist', 'doctor'), updatePatient)
  .delete(protect, authorize('admin'), deletePatient);

module.exports = router;
