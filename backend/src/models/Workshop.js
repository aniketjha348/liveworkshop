/**
 * Workshop Model
 */
const mongoose = require('mongoose');

const workshopSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  date_time: {
    type: String,
    required: true
  },
  duration_minutes: {
    type: Number,
    default: 60
  },
  price: {
    type: Number,
    required: true // Price in paise (1 rupee = 100 paise)
  },
  instructor_name: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: null
  },
  zoom_meeting_id: {
    type: String,
    default: null
  },
  zoom_join_url: {
    type: String,
    default: null
  },
  zoom_start_url: {
    type: String,
    default: null
  },
  reminder_settings: {
    type: [{
      hours_before: { type: Number, required: true },
      type: { type: String, default: 'email' },
      subject: { type: String, default: null }
    }],
    default: []
  },
  created_at: {
    type: String,
    default: () => new Date().toISOString()
  }
}, {
  collection: 'workshops',
  versionKey: false
});

workshopSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.model('Workshop', workshopSchema);
