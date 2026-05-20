require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();




// Middleware - CORS Policy Updated Here 
app.use(cors({
  origin: ["https://ai-clinic-saas.vercel.app"], // frontend link
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/', (req, res) => {
  const uri = process.env.MONGO_URI || '';
  const redactedUri = uri.replace(/:([^@]+)@/, ':***@');
  res.json({
    message: '🏥 AI Clinic Management SaaS API',
    status: 'running',
    version: '1.0.0',
    database: redactedUri || 'none',
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

// 🔥 Connect Database
connectDB();

// 🔥 Only listen if not running on Vercel (serverless environment)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

// Export the app for Vercel Serverless Functions
module.exports = app;