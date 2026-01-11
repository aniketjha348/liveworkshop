/**
 * Profile Routes
 * User profile management - edit, password change, avatar
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, updateProfileSchema, changePasswordSchema } = require('../validators');
const config = require('../config');

const router = express.Router();

// All profile routes require authentication
router.use(authenticate);

// Configure multer for avatar upload
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(config.UPLOAD_DIR || './uploads', 'avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png, webp) are allowed'));
    }
  }
});

/**
 * GET /api/profile
 * Get current user profile
 */
router.get('/', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }
    res.json(user.toJSON());
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ detail: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/profile
 * Update user profile (name, phone, bio)
 */
router.put('/', validate(updateProfileSchema), async (req, res) => {
  try {
    const { name, phone, bio } = req.body;
    
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }
    
    // Update fields
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    user.updated_at = new Date();
    
    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ detail: 'Failed to update profile' });
  }
});

/**
 * PUT /api/profile/password
 * Change user password
 */
router.put('/password', validate(changePasswordSchema), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ detail: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword; // Will be hashed by pre-save hook
    user.updated_at = new Date();
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ detail: 'Failed to change password' });
  }
});

/**
 * POST /api/profile/avatar
 * Upload profile picture
 */
router.post('/avatar', avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded' });
    }
    
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }
    
    // Delete old avatar if exists
    if (user.avatar) {
      const oldPath = path.join(config.UPLOAD_DIR || './uploads', user.avatar.replace('/uploads/', ''));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    
    // Save new avatar path
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    user.updated_at = new Date();
    await user.save();
    
    res.json({
      message: 'Avatar uploaded successfully',
      avatar_url: user.avatar
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ detail: 'Failed to upload avatar' });
  }
});

/**
 * DELETE /api/profile/avatar
 * Remove profile picture
 */
router.delete('/avatar', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }
    
    if (user.avatar) {
      const avatarPath = path.join(config.UPLOAD_DIR || './uploads', user.avatar.replace('/uploads/', ''));
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
      user.avatar = null;
      user.updated_at = new Date();
      await user.save();
    }
    
    res.json({ message: 'Avatar removed successfully' });
  } catch (error) {
    console.error('Remove avatar error:', error);
    res.status(500).json({ detail: 'Failed to remove avatar' });
  }
});

module.exports = router;
