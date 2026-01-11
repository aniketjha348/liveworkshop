/**
 * Registration Routes
 * User's workshop registrations
 */
const express = require('express');
const { Registration, Workshop } = require('../models');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * GET /api/registrations/my-workshops
 * Get current user's registered workshops
 */
router.get('/my-workshops', authenticate, async (req, res) => {
  try {
    const registrations = await Registration.find({
      user_id: req.user.id,
      payment_status: 'completed'
    });
    
    const data = [];
    for (const reg of registrations) {
      const workshop = await Workshop.findOne({ id: reg.workshop_id });
      if (workshop) {
        const item = workshop.toJSON();
        item.registered_at = reg.registered_at;
        item.payment_id = reg.payment_id;
        item.payment_status = reg.payment_status;
        data.push(item);
      }
    }
    
    // Sort by date
    data.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
    
    res.json(data);
  } catch (error) {
    console.error('Get my workshops error:', error);
    res.status(500).json({ detail: 'Failed to fetch your workshops' });
  }
});

/**
 * GET /api/registrations/check/:workshopId
 * Check if user is registered for a workshop
 */
router.get('/check/:workshopId', authenticate, async (req, res) => {
  try {
    const registration = await Registration.findOne({
      user_id: req.user.id,
      workshop_id: req.params.workshopId,
      payment_status: 'completed'
    });
    
    res.json({ is_registered: !!registration });
  } catch (error) {
    console.error('Check registration error:', error);
    res.status(500).json({ detail: 'Failed to check registration' });
  }
});

module.exports = router;
