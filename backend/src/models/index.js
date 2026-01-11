/**
 * Models Index
 */
const User = require('./User');
const Workshop = require('./Workshop');
const Registration = require('./Registration');
const Coupon = require('./Coupon');
const Settings = require('./Settings');
const SentReminder = require('./SentReminder');
const RefreshToken = require('./RefreshToken');

module.exports = {
  User,
  Workshop,
  Registration,
  Coupon,
  Settings,
  SentReminder,
  RefreshToken
};
