/**
 * Payment API Service
 * All payment and coupon-related API calls
 */
import api from './client';

/**
 * Create payment order
 * @param {string} workshopId 
 * @param {string} couponCode 
 * @returns {Promise} Razorpay order data
 */
export const createPaymentOrder = async (workshopId, couponCode = null) => {
  const response = await api.post('/payments/create-order', {
    workshop_id: workshopId,
    coupon_code: couponCode,
  });
  return response.data;
};

/**
 * Verify payment after Razorpay success
 * @param {Object} paymentData 
 * @returns {Promise} Verification result
 */
export const verifyPayment = async (paymentData) => {
  const response = await api.post('/payments/verify', paymentData);
  return response.data;
};

/**
 * Check coupon validity
 * @param {string} code 
 * @param {string} workshopId 
 * @returns {Promise} Coupon validation result
 */
export const checkCoupon = async (code, workshopId) => {
  const response = await api.post('/payments/validate-coupon', {
    code,
    workshop_id: workshopId,
  });
  return response.data;
};
