/**
 * Coupon Routes
 * Coupon CRUD for admin
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Coupon } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * GET /api/coupons
 * Get all coupons (admin only)
 */
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    res.json(coupons.map(c => c.toJSON()));
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ detail: 'Failed to fetch coupons' });
  }
});

/**
 * POST /api/coupons
 * Create coupon (admin only)
 */
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { code, discount_percent, max_uses } = req.body;
    
    // Check if code exists
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ detail: 'Coupon code already exists' });
    }
    
    const coupon = new Coupon({
      id: uuidv4(),
      code: code.toUpperCase(),
      discount_percent,
      max_uses: max_uses || null,
      current_uses: 0,
      is_active: true
    });
    
    await coupon.save();
    res.status(201).json(coupon.toJSON());
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ detail: 'Failed to create coupon' });
  }
});

/**
 * PUT /api/coupons/:id
 * Update coupon (admin only)
 */
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { discount_percent, max_uses, is_active } = req.body;
    
    const coupon = await Coupon.findOne({ id: req.params.id });
    if (!coupon) {
      return res.status(404).json({ detail: 'Coupon not found' });
    }
    
    if (discount_percent !== undefined) coupon.discount_percent = discount_percent;
    if (max_uses !== undefined) coupon.max_uses = max_uses;
    if (is_active !== undefined) coupon.is_active = is_active;
    
    await coupon.save();
    res.json(coupon.toJSON());
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ detail: 'Failed to update coupon' });
  }
});

/**
 * DELETE /api/coupons/:id
 * Delete coupon (admin only)
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await Coupon.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ detail: 'Coupon not found' });
    }
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ detail: 'Failed to delete coupon' });
  }
});

module.exports = router;
