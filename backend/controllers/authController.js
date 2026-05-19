const User = require('../models/User');
const Patient = require('../models/Patient');
const generateToken = require('../utils/generateToken');
const { validationResult } = require('express-validator');

// @desc    Register a new user (public - patient self-signup only)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, age, gender, contact } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Public signup sirf patient role ke liye - admin/doctor/receptionist admin banayega
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'patient',
    });

    // Auto-create patient profile
    const patient = await Patient.create({
      name,
      age: age || 0,
      gender: gender || 'other',
      contact: contact || phone || 'N/A',
      email,
      userAccount: user._id,
      createdBy: user._id,
    });

    user.patientProfile = patient._id;
    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      subscriptionPlan: user.subscriptionPlan,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account deactivated. Contact admin.' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      subscriptionPlan: user.subscriptionPlan,
      specialization: user.specialization,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('patientProfile');
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin creates staff (doctor / receptionist / admin)
// @route   POST /api/auth/create-staff
// @access  Private (Admin only)
const createStaff = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, specialization } = req.body;

    if (!['doctor', 'receptionist', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role for staff creation' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      specialization: role === 'doctor' ? specialization : undefined,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      specialization: user.specialization,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser, getMe, createStaff };
