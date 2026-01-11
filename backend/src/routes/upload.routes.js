/**
 * Upload Routes
 * File upload handling
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const config = require('../config');

const router = express.Router();

// Configure Cloudinary
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

if (config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET
  });
}

// Configure storage (Cloudinary or local fallback)
let storage;

if (config.CLOUDINARY_CLOUD_NAME) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'workshops',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
    },
  });
} else {
  // Ensure upload directory exists
  const uploadDir = path.resolve(config.UPLOAD_DIR);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    }
  });
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, GIF allowed.'));
    }
  }
});

/**
 * POST /api/upload/thumbnail
 * Upload workshop thumbnail
 */
router.post('/thumbnail', authenticate, requireAdmin, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded' });
    }
    
    // If Cloudinary, path is the secure URL. If local, it's the file path.
    const url = req.file.path ? req.file.path.replace(/\\/g, '/') : `/uploads/${req.file.filename}`;
    
    // For local uploads, we need to ensure the path is consistent
    const finalUrl = config.CLOUDINARY_CLOUD_NAME ? req.file.path : `/uploads/${req.file.filename}`;

    res.json({ url: finalUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ detail: 'Upload failed' });
  }
});

module.exports = router;
