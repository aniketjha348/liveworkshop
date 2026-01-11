/**
 * Authentication API Service
 * All auth-related API calls
 */
import api from './client';

/**
 * Login user
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise} User data with token
 */
export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

/**
 * Register new user
 * @param {string} name 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise} User data with token
 */
export const registerUser = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

/**
 * Get current user profile
 * @returns {Promise} User profile data
 */
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

/**
 * Setup admin account (one-time)
 * @param {Object} adminData 
 * @returns {Promise} Admin user data
 */
export const setupAdmin = async (adminData) => {
  const response = await api.post('/auth/admin-setup', adminData);
  return response.data;
};
