/**
 * Zoom Service
 * Zoom meeting creation via OAuth
 */
const axios = require('axios');
const config = require('../config');

// Token cache
let tokenCache = {
  token: null,
  expiresAt: null
};

/**
 * Get Zoom access token (Server-to-Server OAuth)
 */
const getAccessToken = async () => {
  if (!config.ZOOM_CLIENT_ID || !config.ZOOM_CLIENT_SECRET || !config.ZOOM_ACCOUNT_ID) {
    throw new Error('Zoom credentials not configured');
  }
  
  // Check cache
  if (tokenCache.token && tokenCache.expiresAt && new Date() < tokenCache.expiresAt) {
    return tokenCache.token;
  }
  
  // Get new token
  const credentials = Buffer.from(
    `${config.ZOOM_CLIENT_ID}:${config.ZOOM_CLIENT_SECRET}`
  ).toString('base64');
  
  const response = await axios.post(
    'https://zoom.us/oauth/token',
    new URLSearchParams({
      grant_type: 'account_credentials',
      account_id: config.ZOOM_ACCOUNT_ID
    }),
    {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  
  tokenCache.token = response.data.access_token;
  tokenCache.expiresAt = new Date(Date.now() + (response.data.expires_in - 300) * 1000);
  
  return tokenCache.token;
};

/**
 * Create Zoom meeting
 */
const createZoomMeeting = async (workshop) => {
  try {
    const token = await getAccessToken();
    
    const meetingData = {
      topic: workshop.title,
      type: 2, // Scheduled meeting
      start_time: workshop.date_time,
      duration: workshop.duration || 60,
      timezone: 'UTC',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        waiting_room: true
      }
    };
    
    const response = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      meetingData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      meeting_id: String(response.data.id),
      join_url: response.data.join_url,
      start_url: response.data.start_url
    };
  } catch (error) {
    console.error('Zoom meeting creation error:', error.response?.data || error.message);
    return null;
  }
};

module.exports = {
  getAccessToken,
  createZoomMeeting
};
