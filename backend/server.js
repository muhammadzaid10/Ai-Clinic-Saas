require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/', (req, res) => {
  res.json({
    message: '🏥 AI Clinic Management SaaS API',
    status: 'running',
    version: '1.0.0',
  });
});

// Routes (no /api prefix)
app.use('/auth', require('./routes/authRoutes'));
app.use('/patients', require('./routes/patientRoutes'));
app.use('/staff', require('./routes/staffRoutes'));
app.use('/appointments', require('./routes/appointmentRoutes'));
app.use('/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/ai', require('./routes/aiRoutes'));
app.use('/analytics', require('./routes/analyticsRoutes'));

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// 🔥 Pehle Database connect hoga, phir Server chalega
const startServer = async () => {
  try {
    // 1. Database connection ka intezar karein
    await connectDB();
    
    // 2. Agar DB connect ho jaye, to hi server chalayein
    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error(`❌ Server start nahi ho saka kyunke DB fail hogaya: ${error.message}`);
    process.exit(1); // Project ko band kar do agar DB connect na ho
  }
};

// Function ko call karein
startServer();