/**
 * Auth Context
 * Provides authentication state and methods with refresh token support
 */
import React, { createContext, useState, useContext, useEffect } from 'react';
import { api, loginUser, registerUser, getCurrentUser } from '@/services/api';
import { setTokens, clearTokens } from '@/services/api/client';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      clearTokens();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setTokens(data.access_token, data.refresh_token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await registerUser(name, email, password);
    setTokens(data.access_token, data.refresh_token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      // Call logout API to revoke refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refresh_token: refreshToken });
    } catch (error) {
      // Ignore error - token might already be invalid
    }
    clearTokens();
    setUser(null);
  };

  // Update user in context (for profile updates)
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

