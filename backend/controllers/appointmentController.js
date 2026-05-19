const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');

// @desc    Book appointment
// @route   POST /api/appointments
// @access  Admin, Receptionist, Doctor, Patient (self only)
const createAppointment = async (req, res, next) => {
  try {
    let { patient, doctor, date, timeSlot, reason } = req.body;

    // Patient role - self-booking only (use linked patient profile)
    if (req.user.role === 'patient') {
      const myPatient = await Patient.findOne({ userAccount: req.user._id });
      if (!myPatient) {
        return res.status(404).json({ message: 'Patient profile not found' });
      }
      patient = myPatient._id;
    }

    // Conflict check - same doctor + same date + same slot
    const conflict = await Appointment.findOne({
      doctor,
      date: new Date(date),
      timeSlot,
      status: { $in: ['pending', 'confirmed'] },
    });
    if (conflict) {
      return res.status(400).json({
        message: 'Yeh time slot pehle se booked hai. Koi aur slot choose karein.',
      });
    }

    const appointment = await Appointment.create({
      patient,
      doctor,
      date,
      timeSlot,
      reason,
      status: req.user.role === 'patient' ? 'pending' : 'confirmed',
      bookedBy: req.user._id,
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'name age gender contact')
      .populate('doctor', 'name specialization');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Get appointments (role-filtered)
// @route   GET /api/appointments
// @access  All authenticated
const getAppointments = async (req, res, next) => {
  try {
    const { status, date, doctor, patient } = req.query;
    const query = {};

    // Role-based filter
    if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    } else if (req.user.role === 'patient') {
      const myPatient = await Patient.findOne({ userAccount: req.user._id });
      if (!myPatient) return res.json([]);
      query.patient = myPatient._id;
    }

    // Optional filters
    if (status) query.status = status;
    if (doctor && req.user.role !== 'doctor') query.doctor = doctor;
    if (patient && req.user.role !== 'patient') query.patient = patient;

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name age gender contact')
      .populate('doctor', 'name specialization')
      .populate('bookedBy', 'name role')
      .sort({ date: 1, timeSlot: 1 });

    res.json(appointments);
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id
// @access  Admin, Receptionist, Doctor
const updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Doctor can only update their own
    if (
      req.user.role === 'doctor' &&
      appointment.doctor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const allowed = ['status', 'date', 'timeSlot', 'reason', 'notes'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) appointment[field] = req.body[field];
    });

    await appointment.save();
    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'name age gender contact')
      .populate('doctor', 'name specialization');

    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel/delete appointment
// @route   DELETE /api/appointments/:id
// @access  Admin, Receptionist, Patient (own only)
const deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (req.user.role === 'patient') {
      const myPatient = await Patient.findOne({ userAccount: req.user._id });
      if (!myPatient || appointment.patient.toString() !== myPatient._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    appointment.status = 'cancelled';
    await appointment.save();
    res.json({ message: 'Appointment cancelled', appointment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointment,
  deleteAppointment,
};
