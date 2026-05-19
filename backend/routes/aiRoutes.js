const express = require('express');
const {
  aiSymptomCheck,
  aiExplainPrescription,
  aiRiskFlag,
  getDiagnosisLogs,
} = require('../controllers/aiController');
const { protect, authorize, requireProPlan } = require('../middleware/authMiddleware');

const router = express.Router();

// Symptom Checker — Doctor + Pro plan
router.post('/symptom-check', protect, authorize('doctor'), requireProPlan, aiSymptomCheck);

// Prescription Explanation — Doctor (own) or Patient (own)
router.post('/explain-prescription/:id', protect, authorize('doctor', 'patient'), aiExplainPrescription);

// Risk Flagging — Doctor/Admin + Pro plan
router.get('/risk-flag/:patientId', protect, authorize('doctor', 'admin'), requireProPlan, aiRiskFlag);

// Diagnosis Logs — Doctor (own), Admin (all)
router.get('/logs', protect, authorize('doctor', 'admin'), getDiagnosisLogs);

module.exports = router;
