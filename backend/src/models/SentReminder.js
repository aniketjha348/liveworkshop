/**
 * SentReminder Model
 * Track sent reminders to avoid duplicates
 */
const mongoose = require('mongoose');

const sentReminderSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  sent_at: {
    type: String,
    default: () => new Date().toISOString()
  }
}, {
  collection: 'sent_reminders',
  versionKey: false
});

module.exports = mongoose.model('SentReminder', sentReminderSchema);
