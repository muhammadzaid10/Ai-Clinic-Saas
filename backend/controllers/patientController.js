const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');

// @desc    Create new patient
// @route   POST /api/patients
// @access  Admin, Receptionist, Doctor
const createPatient = async (req, res, next) => {
  try {
    const {
      name, age, gender, contact, email, address,
      bloodGroup, allergies, chronicConditions,
    } = req.body;

    const patient = await Patient.create({
      name,
      age,
      gender,
      contact,
      email,
      address,
      bloodGroup: bloodGroup || 'unknown',
      allergies: allergies || [],
      chronicConditions: chronicConditions || [],
      createdBy: req.user._id,
    });

    res.status(201).json(patient);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all patients (with search + pagination)
// @route   GET /api/patients
// @access  Admin, Receptionist, Doctor
const getPatients = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { contact: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const total = await Patient.countDocuments(query);
    const patients = await Patient.find(query)
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      patients,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single patient with full history
// @route   GET /api/patients/:id
// @access  Admin, Receptionist, Doctor, Patient (self only)
const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('createdBy', 'name');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // Patient role can only access own profile
    if (
      req.user.role === 'patient' &&
      patient.userAccount?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch related history
    const appointments = await Appointment.find({ patient: patient._id })
      .populate('doctor', 'name specialization')
      .sort({ date: -1 });

    const prescriptions = await Prescription.find({ patient: patient._id })
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 });

    res.json({ patient, appointments, prescriptions });
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Admin, Receptionist, Doctor
const updatePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Admin only
const deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient's own profile (for patient role)
// @route   GET /api/patients/me/profile
// @access  Patient
const getMyProfile = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ userAccount: req.user._id });
    if (!patient) return res.status(404).json({ message: 'Patient profile not found' });

    const appointments = await Appointment.find({ patient: patient._id })
      .populate('doctor', 'name specialization')
      .sort({ date: -1 });

    const prescriptions = await Prescription.find({ patient: patient._id })
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 });

    res.json({ patient, appointments, prescriptions });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  getMyProfile,
};
