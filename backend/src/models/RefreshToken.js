/**
 * RefreshToken Model
 * Stores refresh tokens for token rotation
 */
const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  user_id: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expires_at: {
    type: Date,
    required: true
  },
  is_revoked: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'refresh_tokens',
  versionKey: false
});

// Index for efficient lookups
// refreshTokenSchema.index({ token: 1 }); // Already indexed by unique: true
refreshTokenSchema.index({ user_id: 1 });
refreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index

refreshTokenSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
