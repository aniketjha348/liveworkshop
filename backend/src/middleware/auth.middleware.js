/**
 * Auth Middleware
 * JWT authentication and role-based access control
 */
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ detail: 'Authorization header missing' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await User.findOne({ id: decoded.sub });
      
      if (!user) {
        return res.status(401).json({ detail: 'User not found' });
      }
      
      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ detail: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ detail: 'Authentication error' });
  }
};

/**
 * Check if user is admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Admin access required' });
  }
  next();
};

module.exports = {
  authenticate,
  requireAdmin
};
