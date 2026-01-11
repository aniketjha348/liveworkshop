/**
 * Coupon Model
 */
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  discount_percent: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  max_uses: {
    type: Number,
    default: null // null = unlimited
  },
  current_uses: {
    type: Number,
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: String,
    default: () => new Date().toISOString()
  }
}, {
  collection: 'coupons',
  versionKey: false
});

// Index for active coupon lookups
couponSchema.index({ code: 1, is_active: 1 });

couponSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.model('Coupon', couponSchema);
