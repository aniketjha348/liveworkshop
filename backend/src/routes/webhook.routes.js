/**
 * Webhook Routes
 * Razorpay payment webhooks
 */
const express = require('express');
const crypto = require('crypto');
const { Registration, Coupon } = require('../models');
const config = require('../config');

const router = express.Router();

/**
 * POST /api/webhooks/razorpay
 * Handle Razorpay webhook events
 */
router.post('/razorpay', async (req, res) => {
  try {
    // Require webhook secret for security
    if (!config.RAZORPAY_WEBHOOK_SECRET) {
      console.error('Webhook secret not configured');
      return res.status(503).json({ detail: 'Webhook not configured' });
    }
    
    const signature = req.headers['x-razorpay-signature'];
    const expectedSignature = crypto
      .createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      console.warn('Invalid webhook signature');
      return res.status(400).json({ detail: 'Invalid signature' });
    }
    
    const payload = JSON.parse(req.body);
    const event = payload.event;
    
    if (event === 'payment.captured') {
      const payment = payload.payload.payment.entity;
      const orderId = payment.order_id;
      
      // Find and update registration
      const registration = await Registration.findOne({ order_id: orderId });
      if (registration && registration.payment_status !== 'completed') {
        registration.payment_status = 'completed';
        registration.payment_id = payment.id;
        await registration.save();
        
        // Update coupon usage atomically
        if (registration.coupon_code) {
          await Coupon.updateOne(
            { code: registration.coupon_code },
            { $inc: { current_uses: 1 } }
          );
        }
      }
    } else if (event === 'payment.failed') {
      const payment = payload.payload.payment.entity;
      const orderId = payment.order_id;
      
      await Registration.updateOne(
        { order_id: orderId },
        { $set: { payment_status: 'failed' } }
      );
    }
    
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).json({ detail: 'Webhook processing failed' });
  }
});

module.exports = router;
