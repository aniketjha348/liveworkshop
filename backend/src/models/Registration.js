/**
 * Registration Model
 * Tracks user workshop registrations and payments
 */
const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  user_id: {
    type: String,
    required: true
  },
  workshop_id: {
    type: String,
    required: true
  },
  payment_status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  payment_id: {
    type: String,
    default: null
  },
  order_id: {
    type: String,
    default: null
  },
  amount: {
    type: Number,
    required: true
  },
  coupon_code: {
    type: String,
    default: null
  },
  registered_at: {
    type: String,
    default: () => new Date().toISOString()
  }
}, {
  collection: 'registrations',
  versionKey: false
});

// Compound index for user-workshop uniqueness
registrationSchema.index({ user_id: 1, workshop_id: 1 }, { unique: true });
// Index for payment verification lookups
registrationSchema.index({ order_id: 1 });
// Index for admin transaction queries
registrationSchema.index({ payment_status: 1 });
registrationSchema.index({ workshop_id: 1, payment_status: 1 });

registrationSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.model('Registration', registrationSchema);
