/**
 * Settings Model
 * Email and app settings
 */
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  id: {
    type: String,
    default: 'default'
  },
  reminder_hours: {
    type: [Number],
    default: [24, 1]
  },
  // Deprecated: kept for backward compatibility if needed, but primary is reminder_hours
  reminder_hours_before: {
    type: Number,
    default: 24
  },
  email_subject_template: {
    type: String,
    default: 'Reminder: {workshop_title} is coming up!'
  },
  sender_name: {
    type: String,
    default: 'LMS Platform'
  },
  sender_email: {
    type: String,
    default: ''
  }
}, {
  collection: 'settings',
  versionKey: false
});

settingsSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.model('Settings', settingsSchema);
