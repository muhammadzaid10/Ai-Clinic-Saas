const { symptomChecker, explainPrescription, flagRisks } = require('../utils/geminiService');
const DiagnosisLog = require('../models/DiagnosisLog');
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

// @desc    AI Symptom Checker
// @route   POST /api/ai/symptom-check
// @access  Doctor (Pro plan)
const aiSymptomCheck = async (req, res, next) => {
  try {
    const { symptoms, age, gender, history, patientId } = req.body;

    if (!symptoms || (Array.isArray(symptoms) && symptoms.length === 0)) {
      return res.status(400).json({ message: 'Symptoms required hain' });
    }

    const result = await symptomChecker({ symptoms, age, gender, history });

    // Log diagnosis attempt regardless of AI success (audit trail)
    if (result.success) {
      await DiagnosisLog.create({
        patient: patientId || undefined,
        doctor: req.user._id,
        symptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
        patientAge: age,
        patientGender: gender,
        medicalHistory: history,
        aiResponse: {
          possibleConditions: result.data.possibleConditions,
          suggestedTests: result.data.suggestedTests,
          recommendations: result.data.recommendations,
          rawResponse: result.data.rawResponse,
        },
        riskLevel: result.data.riskLevel,
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    AI Prescription Explanation
// @route   POST /api/ai/explain-prescription/:id
// @access  Doctor (own prescription), Patient (own)
const aiExplainPrescription = async (req, res, next) => {
  try {
    const { urdu } = req.body;
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    // Access control
    if (req.user.role === 'doctor' && prescription.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'patient') {
      const myPatient = await Patient.findOne({ userAccount: req.user._id });
      if (!myPatient || prescription.patient.toString() !== myPatient._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const result = await explainPrescription({
      diagnosis: prescription.diagnosis,
      medicines: prescription.medicines,
      instructions: prescription.instructions,
      urdu,
    });

    // Save explanation to the prescription for future viewing
    if (result.success) {
      prescription.aiExplanation = result.data.explanation;
      await prescription.save();
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    AI Risk Flagging for a patient
// @route   GET /api/ai/risk-flag/:patientId
// @access  Doctor, Admin (Pro plan)
const aiRiskFlag = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // Gather recent context
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentPrescriptions = await Prescription.find({
      patient: patient._id,
      createdAt: { $gte: sixMonthsAgo },
    }).sort({ createdAt: -1 });

    const recentDiagnoses = recentPrescriptions.map((p) => p.diagnosis);
    const recentSymptoms = [...new Set(recentPrescriptions.flatMap((p) => p.symptoms || []))];

    const result = await flagRisks({
      patientName: patient.name,
      age: patient.age,
      conditions: patient.chronicConditions,
      recentDiagnoses,
      recentSymptoms,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get diagnosis logs (history of AI symptom checks)
// @route   GET /api/ai/logs
// @access  Doctor (own), Admin
const getDiagnosisLogs = async (req, res, next) => {
  try {
    const query = req.user.role === 'doctor' ? { doctor: req.user._id } : {};
    const logs = await DiagnosisLog.find(query)
      .populate('patient', 'name age')
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  aiSymptomCheck,
  aiExplainPrescription,
  aiRiskFlag,
  getDiagnosisLogs,
};
