const axios = require('axios');
const config = require('../../config/env');
const logger = require('../../utils/logger');
const { RateLimiter, retryWithBackoff } = require('../../utils/apiHelpers');

class JustWatchClient {
  constructor() {
    this.baseUrl = config.justWatch.baseUrl;
    this.region = config.justWatch.region;
    this.language = config.justWatch.language;
    this.rateLimiter = new RateLimiter(config.justWatch.requestsPerSecond);
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Make rate-limited request with retry
   */
  async request(endpoint, method = 'GET', data = null) {
    await this.rateLimiter.throttle();

    return retryWithBackoff(
      async () => {
        try {
          const config = {
            method,
            url: endpoint
          };

          if (data) {
            config.data = data;
          }

          const response = await this.client(config);
          return response.data;
        } catch (error) {
          if (error.response) {
            logger.error(`JustWatch API error: ${error.response.status}`, {
              endpoint,
              status: error.response.status
            });
          }
          throw error;
        }
      },
      {
        onRetry: (attempt, delay) => {
          logger.warn(`Retrying JustWatch request (attempt ${attempt})`, { endpoint });
        }
      }
    );
  }

  /**
   * Get available providers (platforms) for a region
   */
  async getProviders() {
    try {
      logger.debug(`Fetching JustWatch providers for region: ${this.region}`);
      
      const endpoint = `/providers/locale/${this.region}`;
      return await this.request(endpoint);
    } catch (error) {
      logger.error('Error fetching JustWatch providers:', error);
      return [];
    }
  }

  /**
   * Search for titles on a specific platform
   */
  async getTitlesByProvider(providerId, page = 1, pageSize = 30) {
    try {
      logger.debug(`Fetching titles from provider ${providerId}, page ${page}`);
      
      const endpoint = `/titles/${this.region}/popular`;
      
      const payload = {
        page,
        page_size: pageSize,
        providers: [providerId],
        content_types: ['movie']
      };

      const response = await this.request(endpoint, 'POST', payload);
      return response;
    } catch (error) {
      logger.error(`Error fetching titles from provider ${providerId}:`, error);
      return { items: [], total_pages: 0 };
    }
  }

  /**
   * Get title details by JustWatch ID
   */
  async getTitleDetails(justWatchId) {
    try {
      logger.debug(`Fetching JustWatch title details: ${justWatchId}`);
      
      const endpoint = `/titles/movie/${justWatchId}/locale/${this.region}`;
      return await this.request(endpoint);
    } catch (error) {
      logger.error(`Error fetching JustWatch title ${justWatchId}:`, error);
      return null;
    }
  }

  /**
   * Search for titles by query
   */
  async searchTitles(query, page = 1) {
    try {
      logger.debug(`Searching JustWatch for: ${query}`);
      
      const endpoint = `/titles/${this.region}/popular`;
      
      const payload = {
        page,
        page_size: 10,
        query,
        content_types: ['movie']
      };

      const response = await this.request(endpoint, 'POST', payload);
      return response.items || [];
    } catch (error) {
      logger.error('Error searching JustWatch:', error);
      return [];
    }
  }

  /**
   * Normalize JustWatch movie data
   */
  normalizeMovieData(jwMovie) {
    const releaseYear = jwMovie.original_release_year || 
                       (jwMovie.release_date ? new Date(jwMovie.release_date).getFullYear() : null);

    return {
      justWatchId: jwMovie.id,
      title: jwMovie.title,
      originalTitle: jwMovie.original_title || jwMovie.title,
      releaseYear,
      posterPath: jwMovie.poster ? this.normalizePosterPath(jwMovie.poster) : null,
      backdropPath: jwMovie.backdrops?.[0] ? this.normalizePosterPath(jwMovie.backdrops[0]) : null,
      tmdbId: jwMovie.external_ids?.tmdb_id || null,
      imdbId: jwMovie.external_ids?.imdb_id || null
    };
  }

  /**
   * Normalize poster path from JustWatch
   */
  normalizePosterPath(poster) {
    if (!poster) return null;
    
    // JustWatch poster paths are like: "/poster/{id}/s592"
    // We'll store just the ID part
    if (typeof poster === 'string' && poster.includes('/poster/')) {
      const match = poster.match(/\/poster\/(\d+)/);
      return match ? `/jw_poster_${match[1]}` : null;
    }
    
    return poster;
  }

  /**
   * Extract offers (availability) from JustWatch movie data
   */
  extractOffers(jwMovie) {
    if (!jwMovie.offers || jwMovie.offers.length === 0) {
      return [];
    }

    return jwMovie.offers.map(offer => ({
      providerId: offer.provider_id?.toString(),
      providerName: offer.provider?.name || null,
      monetizationType: this.mapMonetizationType(offer.monetization_type),
      quality: offer.presentation_type || 'unknown',
      url: offer.urls?.standard_web || null
    }));
  }

  /**
   * Map JustWatch monetization type to our enum
   */
  mapMonetizationType(jwType) {
    const typeMap = {
      'flatrate': 'flatrate',
      'rent': 'rent',
      'buy': 'buy',
      'ads': 'ads',
      'free': 'free'
    };

    return typeMap[jwType?.toLowerCase()] || 'flatrate';
  }

  /**
   * Extract genre IDs from JustWatch movie (note: these might not match TMDB)
   */
  extractGenres(jwMovie) {
    // JustWatch uses different genre IDs than TMDB
    // For now, we'll return the genre names/slugs and resolve them later
    if (!jwMovie.genres) return [];
    
    return jwMovie.genres.map(genre => ({
      jwId: genre.id,
      name: genre.translation || genre.short_name,
      slug: genre.short_name
    }));
  }
}

module.exports = new JustWatchClient();