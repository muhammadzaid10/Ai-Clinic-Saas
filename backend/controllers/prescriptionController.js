const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const { generatePrescriptionPDF } = require('../utils/pdfGenerator');

// @desc    Create prescription
// @route   POST /api/prescriptions
// @access  Doctor
const createPrescription = async (req, res, next) => {
  try {
    const {
      patient, appointment, diagnosis, symptoms,
      medicines, instructions, followUpDate,
    } = req.body;

    if (!diagnosis || !patient) {
      return res.status(400).json({ message: 'Patient and diagnosis are required' });
    }

    const prescription = await Prescription.create({
      patient,
      doctor: req.user._id,
      appointment,
      diagnosis,
      symptoms: symptoms || [],
      medicines: medicines || [],
      instructions,
      followUpDate,
    });

    // If linked to appointment, mark it as completed
    if (appointment) {
      await Appointment.findByIdAndUpdate(appointment, { status: 'completed' });
    }

    const populated = await Prescription.findById(prescription._id)
      .populate('patient', 'name age gender contact bloodGroup')
      .populate('doctor', 'name specialization');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Get prescriptions (role-filtered)
// @route   GET /api/prescriptions
// @access  Doctor, Admin, Patient (own)
const getPrescriptions = async (req, res, next) => {
  try {
    const { patient, search } = req.query;
    const query = {};

    if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    } else if (req.user.role === 'patient') {
      const myPatient = await Patient.findOne({ userAccount: req.user._id });
      if (!myPatient) return res.json([]);
      query.patient = myPatient._id;
    }

    if (patient && req.user.role !== 'patient') query.patient = patient;

    let prescriptions = await Prescription.find(query)
      .populate('patient', 'name age gender contact')
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 });

    // Search in diagnosis or patient name (client-side filter for simplicity)
    if (search) {
      const lower = search.toLowerCase();
      prescriptions = prescriptions.filter(
        (p) =>
          p.diagnosis.toLowerCase().includes(lower) ||
          p.patient?.name?.toLowerCase().includes(lower)
      );
    }

    res.json(prescriptions);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single prescription
// @route   GET /api/prescriptions/:id
// @access  Doctor (own), Admin, Patient (own)
const getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name age gender contact bloodGroup allergies chronicConditions')
      .populate('doctor', 'name specialization');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Access control
    if (req.user.role === 'doctor' && prescription.doctor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'patient') {
      const myPatient = await Patient.findOne({ userAccount: req.user._id });
      if (!myPatient || prescription.patient._id.toString() !== myPatient._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(prescription);
  } catch (error) {
    next(error);
  }
};

// @desc    Download prescription as PDF
// @route   GET /api/prescriptions/:id/pdf
// @access  Doctor, Admin, Patient (own)
const downloadPrescriptionPDF = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name age gender contact bloodGroup')
      .populate('doctor', 'name specialization');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Same access control
    if (req.user.role === 'doctor' && prescription.doctor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'patient') {
      const myPatient = await Patient.findOne({ userAccount: req.user._id });
      if (!myPatient || prescription.patient._id.toString() !== myPatient._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    generatePrescriptionPDF(prescription, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
// @access  Doctor (own)
const updatePrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    if (prescription.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the prescribing doctor can update' });
    }

    const fields = ['diagnosis', 'symptoms', 'medicines', 'instructions', 'followUpDate', 'aiExplanation'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) prescription[f] = req.body[f];
    });

    await prescription.save();
    const populated = await Prescription.findById(prescription._id)
      .populate('patient', 'name age gender contact bloodGroup')
      .populate('doctor', 'name specialization');

    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete prescription
// @route   DELETE /api/prescriptions/:id
// @access  Doctor (own), Admin
const deletePrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    if (
      req.user.role !== 'admin' &&
      prescription.doctor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await prescription.deleteOne();
    res.json({ message: 'Prescription deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  downloadPrescriptionPDF,
  updatePrescription,
  deletePrescription,
};
