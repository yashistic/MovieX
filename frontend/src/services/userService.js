import api from './api';

const userService = {
  // Get user stats
  getStats: async () => {
    try {
      const response = await api.get('/user/stats');
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Favorites
  getFavorites: async () => {
    try {
      const response = await api.get('/user/favorites');
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  addToFavorites: async (movieId) => {
    try {
      const response = await api.post(`/user/favorites/${movieId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  removeFromFavorites: async (movieId) => {
    try {
      const response = await api.delete(`/user/favorites/${movieId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Watchlist
  getWatchlist: async () => {
    try {
      const response = await api.get('/user/watchlist');
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  addToWatchlist: async (movieId) => {
    try {
      const response = await api.post(`/user/watchlist/${movieId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  removeFromWatchlist: async (movieId) => {
    try {
      const response = await api.delete(`/user/watchlist/${movieId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Watched
  getWatched: async () => {
    try {
      const response = await api.get('/user/watched');
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  markAsWatched: async (movieId, rating = null) => {
    try {
      const data = rating ? { rating } : {};
      const response = await api.post(`/user/watched/${movieId}`, data);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  removeFromWatched: async (movieId) => {
    try {
      const response = await api.delete(`/user/watched/${movieId}`);
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default userService;
