/**
 * Configuration
 * Environment variables and app settings
 */

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'ADMIN_SETUP_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set`);
  }
}

module.exports = {
  // MongoDB
  MONGO_URL: process.env.MONGO_URL,
  DB_NAME: process.env.DB_NAME || 'test_database',
  
  // JWT - Required, no fallback
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: '15m', // Access token: 15 minutes
  
  // Refresh Token
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET + '_refresh',
  REFRESH_TOKEN_EXPIRES_IN: '30d', // Refresh token: 30 days
  
  // CORS
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  // Email (Brevo)
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  SENDER_EMAIL: process.env.SENDER_EMAIL,
  SENDER_NAME: process.env.SENDER_NAME || 'LMS Platform',
  
  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  
  // Zoom
  ZOOM_ACCOUNT_ID: process.env.ZOOM_ACCOUNT_ID,
  ZOOM_CLIENT_ID: process.env.ZOOM_CLIENT_ID,
  ZOOM_CLIENT_SECRET: process.env.ZOOM_CLIENT_SECRET,
  
  // Admin - Required, no fallback
  ADMIN_SETUP_KEY: process.env.ADMIN_SETUP_KEY,
  
  // Upload
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads'
};
