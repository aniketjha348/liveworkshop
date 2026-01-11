/**
 * Admin API Service
 * All admin panel API calls
 */
import api from './client';

// ==================== Dashboard ====================

/**
 * Get admin dashboard statistics
 * @returns {Promise} Stats data
 */
export const getAdminStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

// ==================== Workshops ====================

/**
 * Create new workshop
 * @param {Object} workshopData 
 * @returns {Promise} Created workshop
 */
export const createWorkshop = async (workshopData) => {
  const response = await api.post('/admin/workshops', workshopData);
  return response.data;
};

/**
 * Update existing workshop
 * @param {string} workshopId 
 * @param {Object} workshopData 
 * @returns {Promise} Update result
 */
export const updateWorkshop = async (workshopId, workshopData) => {
  const response = await api.put(`/admin/workshops/${workshopId}`, workshopData);
  return response.data;
};

/**
 * Delete workshop
 * @param {string} workshopId 
 * @returns {Promise} Delete result
 */
export const deleteWorkshop = async (workshopId) => {
  const response = await api.delete(`/admin/workshops/${workshopId}`);
  return response.data;
};

/**
 * Get workshop students
 * @param {string} workshopId 
 * @returns {Promise} Students list
 */
export const getWorkshopStudents = async (workshopId) => {
  const response = await api.get(`/admin/workshops/${workshopId}/students`);
  return response.data;
};

/**
 * Manually enroll student
 * @param {string} workshopId 
 * @param {string} email 
 * @returns {Promise} Enrollment result
 */
export const enrollStudent = async (workshopId, email) => {
  const response = await api.post(`/admin/workshops/${workshopId}/enroll`, { email });
  return response.data;
};

/**
 * Send manual reminder to all students
 * @param {string} workshopId 
 * @returns {Promise} Result
 */
export const sendWorkshopReminder = async (workshopId) => {
  const response = await api.post(`/admin/workshops/${workshopId}/send-reminder`);
  return response.data;
};

// ==================== Users ====================

/**
 * Get all users
 * @returns {Promise} Users list
 */
export const getAllUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

// ==================== Transactions ====================

/**
 * Get all transactions
 * @returns {Promise} Transactions list
 */
export const getAllTransactions = async () => {
  const response = await api.get('/admin/transactions');
  return response.data;
};

/**
 * Lookup payment in Razorpay
 * @param {string} referenceId 
 * @returns {Promise} Payment details
 */
export const lookupPayment = async (referenceId) => {
  const response = await api.post('/admin/payments/lookup', { reference_id: referenceId });
  return response.data;
};

// ==================== Coupons ====================

/**
 * Get all coupons
 * @returns {Promise} Coupons list
 */
export const getCoupons = async () => {
  const response = await api.get('/coupons');
  return response.data;
};

/**
 * Create new coupon
 * @param {Object} couponData 
 * @returns {Promise} Created coupon
 */
export const createCoupon = async (couponData) => {
  const response = await api.post('/coupons', couponData);
  return response.data;
};

/**
 * Delete coupon
 * @param {string} code 
 * @returns {Promise} Delete result
 */
export const deleteCoupon = async (id) => {
  const response = await api.delete(`/coupons/${id}`);
  return response.data;
};

// ==================== Email Settings ====================

/**
 * Get email settings
 * @returns {Promise} Email settings
 */
export const getEmailSettings = async () => {
  const response = await api.get('/admin/settings');
  return response.data;
};

/**
 * Update email settings
 * @param {Object} settings 
 * @returns {Promise} Updated settings
 */
export const updateEmailSettings = async (settings) => {
  const response = await api.put('/admin/settings', settings);
  return response.data;
};

/**
 * Send test email
 * @returns {Promise} Test result
 */
export const sendTestEmail = async (email) => {
  const response = await api.post('/admin/settings/test-email', { email });
  return response.data;
};
