const mongoose = require('mongoose');

const diagnosisLogSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    symptoms: [String],
    patientAge: Number,
    patientGender: String,
    medicalHistory: String,
    aiResponse: {
      possibleConditions: [String],
      suggestedTests: [String],
      recommendations: String,
      rawResponse: String,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DiagnosisLog', diagnosisLogSchema);
