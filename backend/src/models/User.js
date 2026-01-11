/**
 * User Model
 * Compatible with existing Python database schema
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  // Support both 'password' and 'hashed_password' (from Python)
  password: {
    type: String,
    required: false
  },
  hashed_password: {
    type: String,
    required: false
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  // Profile fields
  phone: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: null,
    maxlength: 500
  },
  avatar: {
    type: String,
    default: null
  },
  created_at: {
    type: String,
    default: () => new Date().toISOString()
  },
  updated_at: {
    type: Date,
    default: null
  }
}, {
  collection: 'users',
  versionKey: false
});

// Hash password before save (only for new users)
userSchema.pre('save', async function(next) {
  // If hashed_password exists (from Python), migrate it
  if (this.hashed_password && !this.password) {
    this.password = this.hashed_password;
  }
  
  // Only hash if password is modified and doesn't look already hashed
  if (this.isModified('password') && this.password && !this.password.startsWith('$2')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare password method - handles both field names
userSchema.methods.comparePassword = async function(candidatePassword) {
  const storedPassword = this.password || this.hashed_password;
  if (!storedPassword) {
    return false;
  }
  return bcrypt.compare(candidatePassword, storedPassword);
};

// Transform for JSON (remove password fields)
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.hashed_password;
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
