/**
 * Image Utilities
 * Shared image URL construction functions
 */

/**
 * Get full thumbnail URL
 * @param {string} thumbnail - Thumbnail path (relative or absolute URL)
 * @param {string} backendUrl - Backend base URL
 * @param {string} fallback - Fallback image URL
 * @returns {string} Full thumbnail URL
 */
export const getThumbnailUrl = (thumbnail, backendUrl, fallback = null) => {
  if (!thumbnail) {
    return fallback || 'https://images.pexels.com/photos/5940841/pexels-photo-5940841.jpeg';
  }
  return thumbnail.startsWith('http') ? thumbnail : `${backendUrl}${thumbnail}`;
};
