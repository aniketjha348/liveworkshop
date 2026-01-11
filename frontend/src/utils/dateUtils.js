/**
 * Date Utilities
 * Shared date/time formatting functions
 */

/**
 * Format date with relative text (Today, Tomorrow) or formatted date
 * @param {string|Date} dateStr - Date string or Date object
 * @param {string} locale - Locale for formatting (default: 'en-IN')
 * @returns {string} Formatted date string
 */
export const formatDate = (dateStr, locale = 'en-IN') => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date without relative text
 * @param {string|Date} dateStr - Date string or Date object
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} Formatted date string
 */
export const formatDateSimple = (dateStr, locale = 'en-US') => {
  return new Date(dateStr).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format time
 * @param {string|Date} dateStr - Date string or Date object
 * @param {string} locale - Locale for formatting (default: 'en-IN')
 * @returns {string} Formatted time string
 */
export const formatTime = (dateStr, locale = 'en-IN') => {
  return new Date(dateStr).toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format currency in INR
 * @param {number} amount - Amount in paise
 * @returns {string} Formatted currency string
 */
export const formatPrice = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount / 100);
};
