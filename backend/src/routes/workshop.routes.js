/**
 * Workshop Routes
 * Public workshop listing
 */
const express = require('express');
const { Workshop } = require('../models');

const router = express.Router();

/**
 * GET /api/workshops
 * Get all workshops
 */
router.get('/', async (req, res) => {
  try {
    const workshops = await Workshop.find({}).sort({ date_time: -1 });
    res.json(workshops.map(w => w.toJSON()));
  } catch (error) {
    console.error('Get workshops error:', error);
    res.status(500).json({ detail: 'Failed to fetch workshops' });
  }
});

/**
 * GET /api/workshops/:id
 * Get workshop by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const workshop = await Workshop.findOne({ id: req.params.id });
    if (!workshop) {
      return res.status(404).json({ detail: 'Workshop not found' });
    }
    res.json(workshop.toJSON());
  } catch (error) {
    console.error('Get workshop error:', error);
    res.status(500).json({ detail: 'Failed to fetch workshop' });
  }
});

module.exports = router;
