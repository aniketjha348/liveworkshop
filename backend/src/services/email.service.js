/**
 * Email Service
 * Brevo (Sendinblue) email integration
 */
const axios = require('axios');
const config = require('../config');

/**
 * Send email via Brevo API
 */
const sendEmail = async (to, subject, htmlContent) => {
  if (!config.BREVO_API_KEY) {
    console.log('Brevo API key not configured, skipping email');
    return false;
  }
  
  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: config.SENDER_NAME,
          email: config.SENDER_EMAIL
        },
        to: [{ email: to }],
        subject,
        htmlContent
      },
      {
        headers: {
          'api-key': config.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Email send error:', error.response?.data || error.message);
    return false;
  }
};

/**
 * Send workshop reminder email
 */
const sendReminderEmail = async (user, workshop) => {
  const subject = `Reminder: ${workshop.title} is coming up!`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563EB;">Workshop Reminder</h2>
      <p>Hi ${user.name},</p>
      <p>Your workshop <strong>${workshop.title}</strong> is coming up soon!</p>
      
      <div style="background: #F1F5F9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Workshop:</strong> ${workshop.title}</p>
        <p style="margin: 5px 0;"><strong>Instructor:</strong> ${workshop.instructor_name}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(workshop.date_time).toLocaleDateString()}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date(workshop.date_time).toLocaleTimeString()}</p>
        ${workshop.zoom_join_url ? `<p style="margin: 5px 0;"><strong>Join URL:</strong> <a href="${workshop.zoom_join_url}" style="color: #2563EB;">Click here to join</a></p>` : ''}
      </div>
      
      <p>See you there!</p>
      <p style="color: #64748B; font-size: 12px;">— ${config.SENDER_NAME}</p>
    </div>
  `;
  
  return sendEmail(user.email, subject, htmlContent);
};

/**
 * Send test email
 */
const sendTestEmail = async (email) => {
  const subject = 'Test Email from LMS Platform';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563EB;">Email Test Successful!</h2>
      <p>This is a test email from your LMS platform.</p>
      <p>If you received this, your email configuration is working correctly.</p>
      <p style="color: #64748B; font-size: 12px;">— ${config.SENDER_NAME}</p>
    </div>
  `;
  
  return sendEmail(email, subject, htmlContent);
};

/**
 * Send registration confirmation email
 */
const sendRegistrationEmail = async (user, workshop) => {
  const subject = `Registration Confirmed: ${workshop.title}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10B981;">Registration Confirmed!</h2>
      <p>Hi ${user.name},</p>
      <p>You have successfully registered for <strong>${workshop.title}</strong>.</p>
      
      <div style="background: #F1F5F9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Workshop:</strong> ${workshop.title}</p>
        <p style="margin: 5px 0;"><strong>Instructor:</strong> ${workshop.instructor_name}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(workshop.date_time).toLocaleDateString()}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date(workshop.date_time).toLocaleTimeString()}</p>
      </div>
      
      <p>We'll send you a reminder email before the workshop starts with the join link.</p>
      <p>See you there!</p>
      <p style="color: #64748B; font-size: 12px;">— ${config.SENDER_NAME}</p>
    </div>
  `;
  
  return sendEmail(user.email, subject, htmlContent);
};

module.exports = {
  sendEmail,
  sendReminderEmail,
  sendTestEmail,
  sendRegistrationEmail
};
