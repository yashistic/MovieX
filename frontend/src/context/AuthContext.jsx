import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { getAccessToken, clearTokens } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const response = await authService.getProfile();
          if (response.success && response.data?.user) {
            setUser(response.data.user);
          }
        } catch (err) {
          // Token invalid, clear it
          clearTokens();
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen for logout events from API interceptor
    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const signup = useCallback(async (email, password, name) => {
    setError(null);
    try {
      const response = await authService.signup(email, password, name);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: 'Signup failed' };
    } catch (err) {
      const errorMessage = err.error || err.message || 'Signup failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const response = await authService.login(email, password);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (err) {
      const errorMessage = err.error || err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Ignore logout errors
    } finally {
      setUser(null);
      setError(null);
    }
  }, []);

  const updateProfile = useCallback(async (data) => {
    try {
      const response = await authService.updateProfile(data);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: 'Update failed' };
    } catch (err) {
      const errorMessage = err.error || err.message || 'Update failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      if (response.success) {
        return { success: true };
      }
      return { success: false, error: 'Password change failed' };
    } catch (err) {
      const errorMessage = err.error || err.message || 'Password change failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  const deleteAccount = useCallback(async (password) => {
    try {
      const response = await authService.deleteAccount(password);
      if (response.success) {
        setUser(null);
        return { success: true };
      }
      return { success: false, error: 'Delete account failed' };
    } catch (err) {
      const errorMessage = err.error || err.message || 'Delete account failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getProfile();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      }
    } catch (err) {
      // Ignore errors
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    signup,
    login,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    refreshUser,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
