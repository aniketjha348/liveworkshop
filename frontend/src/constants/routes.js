/**
 * Route Constants
 * All application routes defined in one place
 */

export const ROUTES = {
  // Public Routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  WORKSHOP_DETAIL: '/workshop/:id',
  
  // User Dashboard Routes
  DASHBOARD: '/dashboard',
  USER_PROFILE: '/dashboard/profile',
  MY_WORKSHOPS: '/dashboard',
  
  // Admin Routes
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_WORKSHOPS: '/admin/workshops',
  ADMIN_USERS: '/admin/users',
  ADMIN_TRANSACTIONS: '/admin/transactions',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_MARKETING: '/admin/marketing',
  ADMIN_WORKSHOP_STUDENTS: '/admin/workshops/:id/students',
};

/**
 * Get workshop detail route with ID
 * @param {string} id Workshop ID
 * @returns {string} Route path
 */
export const getWorkshopRoute = (id) => `/workshop/${id}`;

/**
 * Get workshop students route with ID
 * @param {string} id Workshop ID
 * @returns {string} Route path
 */
export const getWorkshopStudentsRoute = (id) => `/admin/workshops/${id}/students`;
