const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');

// @desc    Admin overview analytics
// @route   GET /api/analytics/admin
// @access  Admin
const getAdminAnalytics = async (req, res, next) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await User.countDocuments({ role: 'doctor', isActive: true });
    const totalReceptionists = await User.countDocuments({ role: 'receptionist', isActive: true });
    const totalAppointments = await Appointment.countDocuments();
    const totalPrescriptions = await Prescription.countDocuments();

    // Monthly appointments (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAppointments = await Appointment.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = monthlyAppointments.map((m) => ({
      month: monthNames[m._id.month - 1],
      appointments: m.count,
    }));

    // Status distribution
    const statusDist = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Top diagnoses (most common)
    const topDiagnoses = await Prescription.aggregate([
      { $group: { _id: '$diagnosis', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Subscription distribution
    const subDist = await User.aggregate([
      { $match: { role: 'patient' } },
      { $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } },
    ]);

    // Simulated revenue: Pro = $20/month
    const proCount = subDist.find((s) => s._id === 'pro')?.count || 0;
    const simulatedRevenue = proCount * 20;

    // Doctor performance (appointments completed)
    const doctorStats = await Appointment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$doctor', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const doctorIds = doctorStats.map((d) => d._id);
    const doctors = await User.find({ _id: { $in: doctorIds } }).select('name specialization');
    const doctorPerformance = doctorStats.map((d) => {
      const doc = doctors.find((x) => x._id.toString() === d._id.toString());
      return {
        name: doc ? doc.name : 'Unknown',
        specialization: doc?.specialization,
        appointments: d.count,
      };
    });

    res.json({
      stats: {
        totalPatients,
        totalDoctors,
        totalReceptionists,
        totalAppointments,
        totalPrescriptions,
        simulatedRevenue,
      },
      monthlyAppointments: monthlyData,
      statusDistribution: statusDist.map((s) => ({ status: s._id, count: s.count })),
      topDiagnoses: topDiagnoses.map((d) => ({ diagnosis: d._id, count: d.count })),
      subscriptionDistribution: subDist.map((s) => ({ plan: s._id, count: s.count })),
      doctorPerformance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Doctor's personal analytics
// @route   GET /api/analytics/doctor
// @access  Doctor
const getDoctorAnalytics = async (req, res, next) => {
  try {
    const doctorId = req.user._id;

    const totalAppointments = await Appointment.countDocuments({ doctor: doctorId });
    const completed = await Appointment.countDocuments({ doctor: doctorId, status: 'completed' });
    const pending = await Appointment.countDocuments({ doctor: doctorId, status: 'pending' });
    const totalPrescriptions = await Prescription.countDocuments({ doctor: doctorId });

    // Today's count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCount = await Appointment.countDocuments({
      doctor: doctorId,
      date: { $gte: today, $lt: tomorrow },
    });

    // Weekly trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyData = await Appointment.aggregate([
      { $match: { doctor: doctorId, date: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing days
    const weekly = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const found = weeklyData.find((x) => x._id === key);
      weekly.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        appointments: found ? found.count : 0,
      });
    }

    // Top diagnoses by this doctor
    const myDiagnoses = await Prescription.aggregate([
      { $match: { doctor: doctorId } },
      { $group: { _id: '$diagnosis', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      stats: { totalAppointments, completed, pending, totalPrescriptions, todayCount },
      weeklyTrend: weekly,
      topDiagnoses: myDiagnoses.map((d) => ({ diagnosis: d._id, count: d.count })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user subscription plan (admin only)
// @route   PUT /api/analytics/subscription/:userId
// @access  Admin
const updateSubscription = async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!['free', 'pro'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { subscriptionPlan: plan },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Get subscription summary
// @route   GET /api/analytics/subscriptions
// @access  Admin
const getSubscriptions = async (req, res, next) => {
  try {
    const users = await User.find({ role: { $in: ['patient', 'doctor'] } })
      .select('name email role subscriptionPlan createdAt')
      .sort({ subscriptionPlan: -1, createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminAnalytics,
  getDoctorAnalytics,
  updateSubscription,
  getSubscriptions,
};
