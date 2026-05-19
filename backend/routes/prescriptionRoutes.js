const express = require('express');
const {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  downloadPrescriptionPDF,
  updatePrescription,
  deletePrescription,
} = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .get(protect, getPrescriptions)
  .post(protect, authorize('doctor'), createPrescription);

router.get('/:id/pdf', protect, downloadPrescriptionPDF);

router
  .route('/:id')
  .get(protect, getPrescriptionById)
  .put(protect, authorize('doctor'), updatePrescription)
  .delete(protect, authorize('doctor', 'admin'), deletePrescription);

module.exports = router;
