// Run with: node seed.js
// Initial admin banane ke liye
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const seedAdmin = async () => {
  await connectDB();

  const adminEmail = 'admin@clinic.com';
  const doctorEmail = 'doctor@clinic.com';
  const receptionistEmail = 'receptionist@clinic.com';

  console.log('🧹 Cleaning old demo users...');
  await User.deleteMany({ email: { $in: [adminEmail, doctorEmail, receptionistEmail] } });

  console.log('🌱 Creating fresh demo users...');
  const admin = await User.create({
    name: 'Super Admin',
    email: adminEmail,
    password: 'admin123',
    role: 'admin',
    subscriptionPlan: 'pro',
  });

  // Sample doctor
  const doctor = await User.create({
    name: 'Dr. Ahmed Khan',
    email: 'doctor@clinic.com',
    password: 'doctor123',
    role: 'doctor',
    specialization: 'General Physician',
    subscriptionPlan: 'pro',
  });

  // Sample receptionist
  const receptionist = await User.create({
    name: 'Sara Receptionist',
    email: 'receptionist@clinic.com',
    password: 'recep123',
    role: 'receptionist',
  });

  console.log('✅ Seed users created:');
  console.log('   Admin       → admin@clinic.com / admin123');
  console.log('   Doctor      → doctor@clinic.com / doctor123');
  console.log('   Receptionist→ receptionist@clinic.com / recep123');
  await mongoose.disconnect();
  process.exit(0);
};

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
