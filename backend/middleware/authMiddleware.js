const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT verify karta hai aur req.user set karta hai
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'fallback_secret_for_production_and_dev_12345';
      const decoded = jwt.verify(token, secret);

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      if (!user.isActive) {
        return res.status(403).json({ message: 'Account deactivated' });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Role-based access control
// Usage: authorize('admin', 'doctor')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// SaaS Pro plan check - AI features ke liye
const requireProPlan = (req, res, next) => {
  // Admin ko bypass do
  if (req.user.role === 'admin') return next();
  if (req.user.subscriptionPlan !== 'pro') {
    return res.status(403).json({
      message: 'This feature requires Pro subscription plan',
      upgradeRequired: true,
    });
  }
  next();
};

module.exports = { protect, authorize, requireProPlan };
