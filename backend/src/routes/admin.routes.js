/**
 * Admin Routes
 * Workshop CRUD, Stats, User Management
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Workshop, User, Registration, Settings } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { createZoomMeeting } = require('../services/zoom.service');
const { sendReminderEmail } = require('../services/email.service');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

/**
 * GET /api/admin/stats
 * Dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const totalWorkshops = await Workshop.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'student' });
    const registrations = await Registration.find({ payment_status: 'completed' });
    const totalRegistrations = registrations.length;
    const totalRevenue = registrations.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    res.json({
      total_workshops: totalWorkshops,
      total_users: totalUsers,
      total_registrations: totalRegistrations,
      total_revenue: totalRevenue
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ detail: 'Failed to fetch stats' });
  }
});

/**
 * POST /api/admin/workshops
 * Create new workshop
 */
router.post('/workshops', async (req, res) => {
  try {
    const { title, description, date_time, duration, price, instructor_name, thumbnail, reminder_settings } = req.body;
    
    // Create Zoom meeting
    let zoomInfo = null;
    try {
      zoomInfo = await createZoomMeeting({ title, date_time, duration });
    } catch (err) {
      console.log('Zoom meeting creation skipped:', err.message);
    }
    
    const workshop = new Workshop({
      id: uuidv4(),
      title,
      description,
      date_time,
      duration_minutes: duration || 60,
      price: price * 100, // Convert to paise
      instructor_name,
      thumbnail: thumbnail || null,
      zoom_meeting_id: zoomInfo?.meeting_id || null,
      zoom_join_url: zoomInfo?.join_url || null,
      zoom_start_url: zoomInfo?.start_url || null,
      reminder_settings: reminder_settings || []
    });
    
    await workshop.save();
    res.status(201).json(workshop.toJSON());
  } catch (error) {
    console.error('Create workshop error:', error);
    res.status(500).json({ detail: 'Failed to create workshop' });
  }
});

/**
 * PUT /api/admin/workshops/:id
 * Update workshop
 */
router.put('/workshops/:id', async (req, res) => {
  try {
    const { title, description, date_time, duration, price, instructor_name, thumbnail, reminder_settings } = req.body;
    
    const workshop = await Workshop.findOne({ id: req.params.id });
    if (!workshop) {
      return res.status(404).json({ detail: 'Workshop not found' });
    }
    
    // Update fields
    if (title) workshop.title = title;
    if (description) workshop.description = description;
    if (date_time) workshop.date_time = date_time;
    if (duration) workshop.duration_minutes = duration;
    if (price !== undefined) workshop.price = price * 100;
    if (instructor_name) workshop.instructor_name = instructor_name;
    if (thumbnail !== undefined) workshop.thumbnail = thumbnail;
    if (reminder_settings !== undefined) workshop.reminder_settings = reminder_settings;
    
    // Create Zoom meeting if not exists
    if (!workshop.zoom_join_url) {
      try {
        const zoomInfo = await createZoomMeeting({
          title: workshop.title,
          date_time: workshop.date_time,
          duration: workshop.duration_minutes
        });
        if (zoomInfo) {
          workshop.zoom_meeting_id = zoomInfo.meeting_id;
          workshop.zoom_join_url = zoomInfo.join_url;
          workshop.zoom_start_url = zoomInfo.start_url;
        }
      } catch (err) {
        console.log('Zoom meeting creation skipped:', err.message);
      }
    }
    
    await workshop.save();
    res.json(workshop.toJSON());
  } catch (error) {
    console.error('Update workshop error:', error);
    res.status(500).json({ detail: 'Failed to update workshop' });
  }
});

/**
 * DELETE /api/admin/workshops/:id
 * Delete workshop
 */
router.delete('/workshops/:id', async (req, res) => {
  try {
    const result = await Workshop.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ detail: 'Workshop not found' });
    }
    res.json({ message: 'Workshop deleted' });
  } catch (error) {
    console.error('Delete workshop error:', error);
    res.status(500).json({ detail: 'Failed to delete workshop' });
  }
});

/**
 * GET /api/admin/workshops/:id/students
 * Get registered students for a workshop
 */
router.get('/workshops/:id/students', async (req, res) => {
  try {
    const registrations = await Registration.find({
      workshop_id: req.params.id,
      payment_status: 'completed'
    });
    
    const students = [];
    for (const reg of registrations) {
      const user = await User.findOne({ id: reg.user_id });
      if (user) {
        students.push({
          id: user.id,
          name: user.name,
          email: user.email,
          registered_at: reg.registered_at,
          payment_id: reg.payment_id,
          amount: reg.amount
        });
      }
    }
    
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ detail: 'Failed to fetch students' });
  }
});

/**
 * POST /api/admin/workshops/:id/send-reminder
 * Manually send reminder to all students
 */
router.post('/workshops/:id/send-reminder', async (req, res) => {
  try {
    const workshop = await Workshop.findOne({ id: req.params.id });
    if (!workshop) {
      return res.status(404).json({ detail: 'Workshop not found' });
    }
    
    const registrations = await Registration.find({
      workshop_id: workshop.id,
      payment_status: 'completed'
    });
    
    let sentCount = 0;
    for (const reg of registrations) {
      const user = await User.findOne({ id: reg.user_id });
      if (user) {
        try {
          await sendReminderEmail(user, workshop.toJSON());
          sentCount++;
        } catch (err) {
          console.error(`Failed to send to ${user.email}:`, err.message);
        }
      }
    }
    
    res.json({ 
      message: `Reminders sent to ${sentCount} students`,
      sent_count: sentCount
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({ detail: 'Failed to send reminders' });
  }
});

/**
 * GET /api/admin/users
 * Get all users
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'student' });
    res.json(users.map(u => u.toJSON()));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ detail: 'Failed to fetch users' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete user
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const result = await User.deleteOne({ id: req.params.id, role: 'student' });
    if (result.deletedCount === 0) {
      return res.status(404).json({ detail: 'User not found' });
    }
    // Also delete registrations
    await Registration.deleteMany({ user_id: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ detail: 'Failed to delete user' });
  }
});

/**
 * GET /api/admin/transactions
 * Get all transactions
 */
router.get('/transactions', async (req, res) => {
  try {
    const registrations = await Registration.find({ payment_status: 'completed' });
    
    const transactions = [];
    for (const reg of registrations) {
      const user = await User.findOne({ id: reg.user_id });
      const workshop = await Workshop.findOne({ id: reg.workshop_id });
      
      transactions.push({
        id: reg.id,
        user_name: user?.name || 'Unknown',
        user_email: user?.email || 'Unknown',
        workshop_title: workshop?.title || 'Unknown',
        amount: reg.amount,
        payment_id: reg.payment_id,
        registered_at: reg.registered_at,
        date: reg.registered_at, // Frontend expects 'date'
        status: 'completed' // All queried registrations are completed
      });
    }
    
    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ detail: 'Failed to fetch transactions' });
  }
});

/**
 * GET /api/admin/settings
 * Get email settings
 */
router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne({ id: 'default' });
    if (!settings) {
      settings = new Settings({ id: 'default' });
      await settings.save();
    }
    res.json(settings.toJSON());
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ detail: 'Failed to fetch settings' });
  }
});

/**
 * PUT /api/admin/settings
 * Update email settings
 */
router.put('/settings', async (req, res) => {
  try {
    const { reminder_hours_before, email_subject_template, sender_name, sender_email } = req.body;
    
    let settings = await Settings.findOne({ id: 'default' });
    if (!settings) {
      settings = new Settings({ id: 'default' });
    }
    
    if (req.body.reminder_hours) settings.reminder_hours = req.body.reminder_hours;
    // Backward compatibility
    if (reminder_hours_before !== undefined) {
       settings.reminder_hours_before = reminder_hours_before;
       // Also sync to new array if not provided
       if (!req.body.reminder_hours) {
         settings.reminder_hours = [reminder_hours_before];
       }
    }
    if (email_subject_template) settings.email_subject_template = email_subject_template;
    if (sender_name) settings.sender_name = sender_name;
    if (sender_name) settings.sender_name = sender_name;
    if (sender_email) settings.sender_email = sender_email;
    if (req.body.send_confirmation !== undefined) settings.send_confirmation = req.body.send_confirmation;
    if (req.body.send_reminders !== undefined) settings.send_reminders = req.body.send_reminders;
    
    await settings.save();
    res.json(settings.toJSON());
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ detail: 'Failed to update settings' });
  }
});

/**
 * POST /api/admin/settings/test-email
 * Send test email
 */
router.post('/settings/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Import and use email service
    const { sendTestEmail } = require('../services/email.service');
    await sendTestEmail(email);
    
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ detail: 'Failed to send test email' });
  }
});

module.exports = router;
