const axios = require('axios');
const config = require('../../config/env');
const logger = require('../../utils/logger');
const { RateLimiter, retryWithBackoff } = require('../../utils/apiHelpers');

class JustWatchClient {
  constructor() {
    this.baseUrl = 'https://apis.justwatch.com';
    this.graphqlUrl = 'https://apis.justwatch.com/graphql';
    this.region = config.justWatch.region;
    this.language = config.justWatch.language;
    this.rateLimiter = new RateLimiter(config.justWatch.requestsPerSecond);
    
    this.client = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.justwatch.com',
        'Referer': 'https://www.justwatch.com/'
      }
    });
  }

  /**
   * Make rate-limited request with retry
   */
  async request(url, method = 'GET', data = null, headers = {}) {
    await this.rateLimiter.throttle();

    return retryWithBackoff(
      async () => {
        try {
          const config = {
            method,
            url,
            headers: {
              ...this.client.defaults.headers,
              ...headers
            }
          };

          if (data) {
            config.data = data;
            config.headers['Content-Type'] = 'application/json';
          }

          const response = await this.client(config);
          return response.data;
        } catch (error) {
          if (error.response) {
            logger.error(`JustWatch API error: ${error.response.status}`, {
              url,
              status: error.response.status
            });
          }
          throw error;
        }
      },
      {
        onRetry: (attempt, delay) => {
          logger.warn(`Retrying JustWatch request (attempt ${attempt})`, { url });
        }
      }
    );
  }

  /**
   * Get available providers (platforms) for a region using GraphQL
   */
  async getProviders() {
    try {
      logger.debug(`Fetching JustWatch providers for region: ${this.region}`);
      
      const query = `
        query GetProviders($country: Country!) {
          packages(country: $country, platform: WEB) {
            id
            packageId
            clearName
            technicalName
            shortName
            icon
          }
        }
      `;

      const variables = {
        country: 'IN'
      };

      const response = await this.request(
        this.graphqlUrl,
        'POST',
        { query, variables },
        { 'Content-Type': 'application/json' }
      );

      return response.data?.packages || [];
    } catch (error) {
      logger.error('Error fetching JustWatch providers:', error.message);
      return [];
    }
  }

  /**
   * Search for titles using GraphQL (NEW METHOD)
   */
  async searchTitlesGraphQL(options = {}) {
    try {
      const {
        providers = [],
        page = 1,
        pageSize = 30,
        contentTypes = ['MOVIE']
      } = options;

      logger.debug(`Searching JustWatch titles (page ${page})`);

      const query = `
        query GetPopularTitles(
          $country: Country!
          $language: Language!
          $first: Int!
          $page: Int
          $packages: [String!]
          $objectTypes: [ObjectType!]
        ) {
          popularTitles(
            country: $country
            first: $first
            page: $page
            packages: $packages
            sortBy: POPULAR
            objectTypes: $objectTypes
          ) {
            edges {
              node {
                id
                objectId
                objectType
                content(country: $country, language: $language) {
                  title
                  originalReleaseYear
                  originalReleaseDate
                  shortDescription
                  posterUrl
                  backdrops {
                    backdropUrl
                  }
                  externalIds {
                    imdbId
                    tmdbId
                  }
                  genres {
                    shortName
                    translation(language: $language)
                  }
                }
                offers(country: $country, platform: WEB) {
                  monetizationType
                  presentationType
                  package {
                    id
                    packageId
                    clearName
                  }
                  standardWebURL
                }
              }
            }
            pageInfo {
              endCursor
              hasNextPage
            }
            totalCount
          }
        }
      `;

      const variables = {
        country: 'IN',
        language: 'en',
        first: pageSize,
        page: page - 1, // JustWatch uses 0-based pagination
        packages: providers.length > 0 ? providers : undefined,
        objectTypes: contentTypes
      };

      const response = await this.request(
        this.graphqlUrl,
        'POST',
        { query, variables }
      );

      const edges = response.data?.popularTitles?.edges || [];
      const items = edges.map(edge => this.normalizeGraphQLNode(edge.node));
      
      const pageInfo = response.data?.popularTitles?.pageInfo || {};
      const totalCount = response.data?.popularTitles?.totalCount || 0;
      
      return {
        items,
        total_pages: Math.ceil(totalCount / pageSize),
        has_next_page: pageInfo.hasNextPage
      };
    } catch (error) {
      logger.error('Error searching JustWatch titles:', error.message);
      return { items: [], total_pages: 0, has_next_page: false };
    }
  }

  /**
   * Get titles by provider using GraphQL
   */
  async getTitlesByProvider(providerId, page = 1, pageSize = 30) {
    try {
      logger.debug(`Fetching titles from provider ${providerId}, page ${page}`);
      
      return await this.searchTitlesGraphQL({
        providers: [providerId],
        page,
        pageSize,
        contentTypes: ['MOVIE']
      });
    } catch (error) {
      logger.error(`Error fetching titles from provider ${providerId}:`, error.message);
      return { items: [], total_pages: 0 };
    }
  }

  /**
   * Normalize GraphQL node to old format
   */
  normalizeGraphQLNode(node) {
    const content = node.content || {};
    
    return {
      id: node.objectId?.toString() || node.id,
      object_type: node.objectType,
      title: content.title,
      original_title: content.title,
      original_release_year: content.originalReleaseYear,
      release_date: content.originalReleaseDate,
      short_description: content.shortDescription,
      poster: content.posterUrl,
      backdrops: content.backdrops?.map(b => b.backdropUrl) || [],
      external_ids: {
        imdb_id: content.externalIds?.imdbId,
        tmdb_id: content.externalIds?.tmdbId
      },
      genres: content.genres || [],
      offers: node.offers || []
    };
  }

  /**
   * Get title details by JustWatch ID
   */
  async getTitleDetails(justWatchId) {
    try {
      logger.debug(`Fetching JustWatch title details: ${justWatchId}`);
      
      // Try the old REST endpoint first
      const endpoint = `${this.baseUrl}/content/titles/movie/${justWatchId}/locale/${this.region}`;
      return await this.request(endpoint);
    } catch (error) {
      logger.error(`Error fetching JustWatch title ${justWatchId}:`, error.message);
      return null;
    }
  }

  /**
   * Search for titles by query
   */
  async searchTitles(query, page = 1) {
    try {
      logger.debug(`Searching JustWatch for: ${query}`);
      
      // Use GraphQL search
      const graphqlQuery = `
        query SearchTitles($searchQuery: String!, $country: Country!, $language: Language!) {
          titleSearch(searchQuery: $searchQuery, country: $country, language: $language, first: 10) {
            edges {
              node {
                id
                objectId
                objectType
                content(country: $country, language: $language) {
                  title
                  originalReleaseYear
                }
              }
            }
          }
        }
      `;

      const response = await this.request(
        this.graphqlUrl,
        'POST',
        {
          query: graphqlQuery,
          variables: {
            searchQuery: query,
            country: 'IN',
            language: 'en'
          }
        }
      );

      const edges = response.data?.titleSearch?.edges || [];
      return edges.map(edge => this.normalizeGraphQLNode(edge.node));
    } catch (error) {
      logger.error('Error searching JustWatch:', error.message);
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
      justWatchId: jwMovie.id?.toString(),
      title: jwMovie.title,
      originalTitle: jwMovie.original_title || jwMovie.title,
      releaseYear,
      overview: jwMovie.short_description || null,
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
    
    // If it's already a full URL, extract the path
    if (typeof poster === 'string') {
      if (poster.startsWith('http')) {
        return poster;
      }
      if (poster.includes('/poster/')) {
        const match = poster.match(/\/poster\/(\d+)/);
        return match ? `/jw_poster_${match[1]}` : null;
      }
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
      providerId: offer.package?.packageId?.toString() || offer.package?.id?.toString(),
      providerName: offer.package?.clearName || null,
      monetizationType: this.mapMonetizationType(offer.monetizationType),
      quality: offer.presentationType || 'unknown',
      url: offer.standardWebURL || null
    }));
  }

  /**
   * Map JustWatch monetization type to our enum
   */
  mapMonetizationType(jwType) {
    const typeMap = {
      'FLATRATE': 'flatrate',
      'RENT': 'rent',
      'BUY': 'buy',
      'ADS': 'ads',
      'FREE': 'free',
      'FLATRATE_AND_BUY': 'flatrate'
    };

    return typeMap[jwType?.toUpperCase()] || 'flatrate';
  }

  /**
   * Extract genre IDs from JustWatch movie
   */
  extractGenres(jwMovie) {
    if (!jwMovie.genres) return [];
    
    return jwMovie.genres.map(genre => ({
      name: genre.translation || genre.shortName,
      slug: genre.shortName
    }));
  }
}

module.exports = new JustWatchClient();