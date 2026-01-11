/**
 * Scheduler Service
 * Background jobs for email reminders
 */
const cron = require('node-cron');
const { Workshop, Registration, Settings, SentReminder, User } = require('../models');
const { sendReminderEmail } = require('./email.service');

let schedulerTask = null;

/**
 * Check and send workshop reminders
 */
const checkAndSendReminders = async () => {
  try {
    // Get default settings
    let settings = await Settings.findOne({ id: 'default' });
    if (!settings) {
      settings = { reminder_hours_before: 24 };
    }
    
    const now = new Date();
    
    // Find all upcoming workshops (active)
    const workshops = await Workshop.find({});
    
    for (const workshop of workshops) {
      const workshopDate = new Date(workshop.date_time);
      
      // Skip if already started/past
      if (workshopDate <= now) continue;

      // Determine reminders to check for this workshop
      let remindersToCheck = [];
      
      if (workshop.reminder_settings && workshop.reminder_settings.length > 0) {
        remindersToCheck = workshop.reminder_settings.map(r => ({
          hours: r.hours_before,
          keySuffix: `${r.hours_before}h`
        }));
      } else {
        // Fallback to global default
        const defaultHours = settings.reminder_hours && settings.reminder_hours.length > 0 
          ? settings.reminder_hours 
          : [settings.reminder_hours_before || 24];
          
        remindersToCheck = defaultHours.map(h => ({
          hours: h,
          keySuffix: 'default' // We might want to suffix with hours to differentiate? But 'default' is legacy.
          // Better: differentiate if multiple.
        }));
        
        // If multiple defaults, we need unique keys to prevent identifying as same reminder
        if (remindersToCheck.length > 1) {
           remindersToCheck = defaultHours.map(h => ({
             hours: h,
             keySuffix: `${h}h_default`
           }));
        }
      }

      for (const reminder of remindersToCheck) {
        // Calculate trigger window
        // Trigger if: now >= (start - hours)
        const timeToStartHours = (workshopDate - now) / (1000 * 60 * 60);
        
        // We trigger if we are WITHIN the window (e.g. 24 hours or less remaining)
        // But to avoid sending it too early (e.g. 25 hours before), we check:
        // timeToStart <= reminder.hours
        
        // Also we shouldn't send if it's too late (e.g. workshop started). 
        // (Handled by workshopDate > now check above)
        
        if (timeToStartHours <= reminder.hours) {
          
          // Get registered users
          const registrations = await Registration.find({
            workshop_id: workshop.id,
            payment_status: 'completed'
          });
          
          for (const reg of registrations) {
            // Unique key for this specific reminder
            const reminderKey = `${workshop.id}_${reg.user_id}_${reminder.keySuffix}`;
            
            // Check if already sent
            // We also check the old key format for backward compatibility if using default
            let alreadySent = await SentReminder.findOne({ key: reminderKey });
            
            if (!alreadySent && reminder.keySuffix === 'default') {
              // Check old key format
              alreadySent = await SentReminder.findOne({ key: `${workshop.id}_${reg.user_id}_reminder` });
            }
            
            if (!alreadySent) {
              const user = await User.findOne({ id: reg.user_id });
              if (user) {
                try {
                  await sendReminderEmail(user, workshop);
                  
                  // Mark as sent
                  await SentReminder.create({
                    key: reminderKey,
                    sent_at: new Date().toISOString()
                  });
                  
                  console.log(`Reminder (${reminder.keySuffix}) sent to ${user.email} for ${workshop.title}`);
                } catch (err) {
                  console.error(`Failed to send reminder to ${user.email}:`, err.message);
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Scheduler error:', error);
  }
};

/**
 * Start the scheduler
 * Runs every 15 minutes
 */
const startScheduler = () => {
  if (schedulerTask) {
    console.log('Scheduler already running');
    return;
  }
  
  // Run every 15 minutes
  schedulerTask = cron.schedule('*/15 * * * *', async () => {
    console.log('Running reminder check...');
    await checkAndSendReminders();
  });
  
  console.log('Reminder scheduler started (runs every 15 minutes)');
};

/**
 * Stop the scheduler
 */
const stopScheduler = () => {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
    console.log('Scheduler stopped');
  }
};

module.exports = {
  startScheduler,
  stopScheduler,
  checkAndSendReminders
};
