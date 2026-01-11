/**
 * Application Configuration
 * Environment-based configuration
 */

export const CONFIG = {
  // API Configuration
  API_URL: process.env.REACT_APP_BACKEND_URL,
  
  // App Info
  APP_NAME: 'WorkshopFlow',
  APP_DESCRIPTION: 'Premium Workshop Platform',
  
  // Razorpay
  RAZORPAY_KEY: process.env.REACT_APP_RAZORPAY_KEY_ID,
  
  // File Upload
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  
  // Date/Time
  DATE_FORMAT: 'MMM dd, yyyy',
  TIME_FORMAT: 'hh:mm a',
  DATETIME_FORMAT: 'MMM dd, yyyy hh:mm a',
};
