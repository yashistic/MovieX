import api, { setTokens, clearTokens, getRefreshToken } from './api';

const authService = {
  // Sign up new user
  signup: async (email, password, name) => {
    try {
      const response = await api.post('/auth/signup', { email, password, name });
      if (response.success && response.data) {
        const { accessToken, refreshToken } = response.data;
        setTokens(accessToken, refreshToken);
      }
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.success && response.data) {
        const { accessToken, refreshToken } = response.data;
        setTokens(accessToken, refreshToken);
      }
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      const refreshToken = getRefreshToken();
      await api.post('/auth/logout', { refreshToken });
    } catch (error) {
      // Ignore logout errors
    } finally {
      clearTokens();
    }
  },

  // Logout from all devices
  logoutAll: async () => {
    try {
      await api.post('/auth/logout-all');
    } catch (error) {
      // Ignore errors
    } finally {
      clearTokens();
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/me');
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update user profile
  updateProfile: async (data) => {
    try {
      const response = await api.patch('/auth/me', data);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      if (response.success && response.data) {
        const { accessToken, refreshToken } = response.data;
        setTokens(accessToken, refreshToken);
      }
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete account
  deleteAccount: async (password) => {
    try {
      const response = await api.delete('/auth/me', { data: { password } });
      clearTokens();
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default authService;
