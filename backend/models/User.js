const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // password ko default queries mein return nahi karega
    },
    role: {
      type: String,
      enum: ['admin', 'doctor', 'receptionist', 'patient'],
      required: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    // Doctor specific fields
    specialization: {
      type: String,
      trim: true,
    },
    // Patient specific fields - linked to Patient doc
    patientProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },
    // SaaS subscription
    subscriptionPlan: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Password hash before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
