/**
 * Auth Routes
 * Login, Register, Token Refresh, Logout
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { User, RefreshToken } = require('../models');
const config = require('../config');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, registerSchema, loginSchema } = require('../validators');

const router = express.Router();

/**
 * Generate tokens pair (access + refresh)
 */
const generateTokens = async (user) => {
  // Access token (short-lived)
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
  
  // Refresh token (long-lived)
  const refreshTokenId = uuidv4();
  const refreshTokenValue = jwt.sign(
    { sub: user.id, jti: refreshTokenId },
    config.REFRESH_TOKEN_SECRET,
    { expiresIn: config.REFRESH_TOKEN_EXPIRES_IN }
  );
  
  // Store refresh token in DB
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
  
  await RefreshToken.create({
    id: refreshTokenId,
    user_id: user.id,
    token: refreshTokenValue,
    expires_at: expiresAt
  });
  
  return { accessToken, refreshToken: refreshTokenValue };
};

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ detail: 'Email already registered' });
    }
    
    // Create user
    const user = new User({
      id: uuidv4(),
      name,
      email: email.toLowerCase(),
      password,
      role: 'student'
    });
    
    await user.save();
    
    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user);
    
    res.status(201).json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ detail: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }
    
    // Revoke old refresh tokens for this user (optional: keep last 5)
    await RefreshToken.deleteMany({ user_id: user.id });
    
    // Generate new tokens
    const { accessToken, refreshToken } = await generateTokens(user);
    
    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ detail: 'Login failed' });
  }
});

/**
 * POST /api/auth/refresh
 * Get new access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({ detail: 'Refresh token required' });
    }
    
    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refresh_token, config.REFRESH_TOKEN_SECRET);
    } catch (err) {
      return res.status(401).json({ detail: 'Invalid or expired refresh token' });
    }
    
    // Check if token exists in DB and not revoked
    const storedToken = await RefreshToken.findOne({
      token: refresh_token,
      is_revoked: false
    });
    
    if (!storedToken) {
      return res.status(401).json({ detail: 'Refresh token not found or revoked' });
    }
    
    // Get user
    const user = await User.findOne({ id: decoded.sub });
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }
    
    // Revoke old token
    storedToken.is_revoked = true;
    await storedToken.save();
    
    // Generate new tokens (token rotation)
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user);
    
    res.json({
      access_token: accessToken,
      refresh_token: newRefreshToken,
      token_type: 'bearer'
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ detail: 'Token refresh failed' });
  }
});

/**
 * POST /api/auth/logout
 * Revoke refresh token
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (refresh_token) {
      // Revoke specific token
      await RefreshToken.updateOne(
        { token: refresh_token },
        { $set: { is_revoked: true } }
      );
    } else {
      // Revoke all user's refresh tokens
      await RefreshToken.updateMany(
        { user_id: req.user.id },
        { $set: { is_revoked: true } }
      );
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ detail: 'Logout failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', authenticate, async (req, res) => {
  res.json(req.user.toJSON());
});

/**
 * POST /api/auth/admin-setup
 * One-time admin setup
 */
router.post('/admin-setup', async (req, res) => {
  try {
    const { name, email, password, setup_key } = req.body;
    
    // Verify setup key
    if (setup_key !== config.ADMIN_SETUP_KEY) {
      return res.status(403).json({ detail: 'Invalid setup key' });
    }
    
    // Check if admin exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ detail: 'Admin already exists' });
    }
    
    // Check if email is taken
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ detail: 'Email already registered' });
    }
    
    // Create admin user
    const admin = new User({
      id: uuidv4(),
      name,
      email: email.toLowerCase(),
      password,
      role: 'admin'
    });
    
    await admin.save();
    
    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(admin);
    
    res.status(201).json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      user: admin.toJSON()
    });
  } catch (error) {
    console.error('Admin setup error:', error);
    res.status(500).json({ detail: 'Admin setup failed' });
  }
});

module.exports = router;

