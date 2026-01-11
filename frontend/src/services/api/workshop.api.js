/**
 * Workshop API Service
 * All workshop-related API calls
 */
import api from './client';

/**
 * Get all workshops
 * @returns {Promise} List of workshops
 */
export const getWorkshops = async () => {
  const response = await api.get('/workshops');
  return response.data;
};

/**
 * Get single workshop by ID
 * @param {string} workshopId 
 * @returns {Promise} Workshop data
 */
export const getWorkshop = async (workshopId) => {
  const response = await api.get(`/workshops/${workshopId}`);
  return response.data;
};

/**
 * Get user's registered workshops
 * @returns {Promise} List of user's workshops
 */
export const getMyWorkshops = async () => {
  const response = await api.get('/registrations/my-workshops');
  return response.data;
};

/**
 * Upload workshop thumbnail
 * @param {File} file 
 * @returns {Promise} Upload result with URL
 */
export const uploadThumbnail = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/upload/thumbnail', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Check if user is registered for a workshop
 * @param {string} workshopId 
 * @returns {Promise} {is_registered: boolean}
 */
export const checkRegistration = async (workshopId) => {
  const response = await api.get(`/registrations/check/${workshopId}`);
  return response.data;
};
