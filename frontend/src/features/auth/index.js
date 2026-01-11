/**
 * Auth Feature Index
 * Export all authentication-related pages and components
 */

// Pages
export { default as Login } from './Login';
export { default as Register } from './Register';

// Context
export { AuthProvider, useAuth } from './AuthContext';
