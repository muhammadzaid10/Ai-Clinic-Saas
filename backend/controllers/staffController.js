const User = require('../models/User');

// @desc    Get all staff (doctors + receptionists + admins)
// @route   GET /api/staff
// @access  Admin
const getAllStaff = async (req, res, next) => {
  try {
    const { role, search = '' } = req.query;
    const query = {
      role: role ? role : { $in: ['admin', 'doctor', 'receptionist'] },
    };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const staff = await User.find(query).sort({ createdAt: -1 });
    res.json(staff);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all doctors (for booking dropdown)
// @route   GET /api/staff/doctors
// @access  Authenticated
const getDoctors = async (req, res, next) => {
  try {
    const doctors = await User.find({ role: 'doctor', isActive: true }).select(
      'name email specialization phone'
    );
    res.json(doctors);
  } catch (error) {
    next(error);
  }
};

// @desc    Update staff member
// @route   PUT /api/staff/:id
// @access  Admin
const updateStaff = async (req, res, next) => {
  try {
    const { name, email, phone, specialization, isActive, subscriptionPlan } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Staff not found' });

    user.name = name ?? user.name;
    user.email = email ?? user.email;
    user.phone = phone ?? user.phone;
    user.specialization = specialization ?? user.specialization;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (subscriptionPlan) user.subscriptionPlan = subscriptionPlan;

    await user.save();
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete staff
// @route   DELETE /api/staff/:id
// @access  Admin
const deleteStaff = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Aap khud ko delete nahi kar sakte' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Staff not found' });
    res.json({ message: 'Staff deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllStaff, getDoctors, updateStaff, deleteStaff };
