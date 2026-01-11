/**
 * Main Server Entry Point
 * Express.js application with all routes and middleware
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./src/db');
const authRoutes = require('./src/routes/auth.routes');
const workshopRoutes = require('./src/routes/workshop.routes');
const adminRoutes = require('./src/routes/admin.routes');
const paymentRoutes = require('./src/routes/payment.routes');
const registrationRoutes = require('./src/routes/registration.routes');
const couponRoutes = require('./src/routes/coupon.routes');
const webhookRoutes = require('./src/routes/webhook.routes');
const uploadRoutes = require('./src/routes/upload.routes');
const profileRoutes = require('./src/routes/profile.routes');
const { startScheduler } = require('./src/services/scheduler.service');

const app = express();
const PORT = process.env.PORT || 8000;

// CORS Configuration
// Security & Utilities
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// ... existing imports ...

// CORS Configuration
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5000'];
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Prevent HTTP param pollution
app.use(hpp());

// Sanitize data
app.use(mongoSanitize());

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 10 minutes'
});
app.use('/api', limiter);

// Body parser
app.use('/api/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10kb' })); // Body limit is security practice
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (public access)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workshops', workshopRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/profile', profileRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    detail: err.message || 'Internal Server Error'
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Start background scheduler
    startScheduler();
    console.log('Scheduler started');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
