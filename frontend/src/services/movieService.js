import api from './api';

const movieService = {
  // Get all movies with optional filters
  getMovies: async (params = {}) => {
    try {
      const response = await api.get('/movies', { params });
      return response;
    } catch (error) {
      console.error('Error fetching movies:', error);
      throw error;
    }
  },

  // Get single movie by ID
  getMovieById: async (id) => {
    try {
      const response = await api.get(`/movies/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching movie:', error);
      throw error;
    }
  },

  // Get movies by genre name
  getMoviesByGenre: async (genreName, params = {}) => {
    try {
      const response = await api.get(`/genres/${encodeURIComponent(genreName)}/movies`, { params });
      return response;
    } catch (error) {
      console.error('Error fetching movies by genre:', error);
      throw error;
    }
  },

  // Get all genres
  getGenres: async () => {
    try {
      const response = await api.get('/genres');
      return response;
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }
  },

  // Get all platforms
  getPlatforms: async () => {
    try {
      const response = await api.get('/platforms');
      return response;
    } catch (error) {
      console.error('Error fetching platforms:', error);
      throw error;
    }
  },

  // Get catalog statistics
  getStatistics: async () => {
    try {
      const response = await api.get('/statistics');
      return response;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return response;
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  },
};

export default movieService;
