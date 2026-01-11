/**
 * Database Connection
 * MongoDB with Mongoose
 */
const mongoose = require('mongoose');
const config = require('../config');

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGO_URL, {
      dbName: config.DB_NAME
    });
    console.log(`MongoDB connected to database: ${config.DB_NAME}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
};

module.exports = connectDB;
