/**
 * Payment Routes
 * Razorpay integration
 */
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { Workshop, Registration, Coupon } = require('../models');
const { authenticate } = require('../middleware/auth.middleware');
const config = require('../config');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_KEY_SECRET
});

/**
 * POST /api/payments/create-order
 * Create Razorpay order
 */
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { workshop_id, coupon_code } = req.body;
    
    // Get workshop
    const workshop = await Workshop.findOne({ id: workshop_id });
    if (!workshop) {
      return res.status(404).json({ detail: 'Workshop not found' });
    }
    
    // Check if already registered
    const existingReg = await Registration.findOne({
      user_id: req.user.id,
      workshop_id,
      payment_status: 'completed'
    });
    if (existingReg) {
      return res.status(400).json({ detail: 'Already registered for this workshop' });
    }
    
    // Calculate price
    let amount = workshop.price;
    let appliedCoupon = null;
    
    if (coupon_code) {
      const coupon = await Coupon.findOne({
        code: coupon_code.toUpperCase(),
        is_active: true
      });
      
      if (coupon) {
        // Check usage limits
        if (!coupon.max_uses || coupon.current_uses < coupon.max_uses) {
          amount = Math.round(amount * (1 - coupon.discount_percent / 100));
          appliedCoupon = coupon;
        }
      }
    }
    
    // Handle free workshops
    if (amount === 0) {
      // Direct registration for free
      const registration = new Registration({
        id: uuidv4(),
        user_id: req.user.id,
        workshop_id,
        payment_status: 'completed',
        payment_id: 'FREE',
        order_id: 'FREE',
        amount: 0,
        coupon_code: appliedCoupon?.code || null
      });
      await registration.save();
      
      // Update coupon usage atomically
      if (appliedCoupon) {
        await Coupon.updateOne(
          { _id: appliedCoupon._id },
          { $inc: { current_uses: 1 } }
        );
      }
      
      return res.json({
        free: true,
        message: 'Registered successfully (Free)'
      });
    }
    
    // Create Razorpay order
      const receiptId = `w_${workshop_id.slice(0,8)}_u_${req.user.id.slice(0,8)}`;

      const order = await razorpay.orders.create({
        amount: Math.round(amount),
        currency: 'INR',
        receipt: receiptId,
        notes: { workshop_id, user_id: req.user.id }
      });
    
    // Create pending registration
    const registration = new Registration({
      id: uuidv4(),
      user_id: req.user.id,
      workshop_id,
      payment_status: 'pending',
      order_id: order.id,
      amount,
      coupon_code: appliedCoupon?.code || null
    });
    await registration.save();
    
    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: config.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create order error:', error.message);
    res.status(500).json({ detail: 'Failed to create payment order' });
  }
});

/**
 * POST /api/payments/verify
 * Verify Razorpay payment
 */
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
    
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ detail: 'Invalid payment signature' });
    }
    
    // Find and update registration
    const registration = await Registration.findOne({ order_id: razorpay_order_id });
    if (!registration) {
      return res.status(404).json({ detail: 'Registration not found' });
    }
    
    // Check idempotency - already completed
    if (registration.payment_status === 'completed') {
      return res.json({ message: 'Payment already verified' });
    }
    
    registration.payment_status = 'completed';
    registration.payment_id = razorpay_payment_id;
    await registration.save();
    
    // Update coupon usage if applicable
    if (registration.coupon_code) {
      const coupon = await Coupon.findOne({ code: registration.coupon_code });
      if (coupon) {
        coupon.current_uses += 1;
        await coupon.save();
      }
    }

    // Send confirmation email
    try {
      const { User, Workshop } = require('../models');
      const { sendRegistrationEmail } = require('../services/email.service');
      
      const user = await User.findOne({ id: registration.user_id });
      const workshop = await Workshop.findOne({ id: registration.workshop_id });
      
      if (user && workshop) {
        await sendRegistrationEmail(user, workshop);
      }
    } catch (err) {
      console.error('Failed to send registration email:', err);
    }
    
    res.json({ message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ detail: 'Payment verification failed' });
  }
});

/**
 * POST /api/payments/validate-coupon
 * Validate coupon code
 */
router.post('/validate-coupon', authenticate, async (req, res) => {
  try {
    const { code, workshop_id } = req.body;
    
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      is_active: true
    });
    
    if (!coupon) {
      return res.status(404).json({ detail: 'Invalid coupon code' });
    }
    
    // Check usage limits
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return res.status(400).json({ detail: 'Coupon usage limit reached' });
    }
    
    // Get workshop for price calculation
    const workshop = await Workshop.findOne({ id: workshop_id });
    const originalPrice = workshop?.price || 0;
    const discountedPrice = Math.round(originalPrice * (1 - coupon.discount_percent / 100));
    
    res.json({
      valid: true,
      discount_percent: coupon.discount_percent,
      original_price: originalPrice,
      discounted_price: discountedPrice
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ detail: 'Coupon validation failed' });
  }
});

module.exports = router;
