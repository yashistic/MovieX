const justWatchClient = require('../external/JustWatchClient');
const platformRepository = require('../../repositories/PlatformRepository');
const movieRepository = require('../../repositories/MovieRepository');
const availabilityRepository = require('../../repositories/AvailabilityRepository');
const logger = require('../../utils/logger');
const slugify = require('slugify');

class JustWatchIngestion {
  /**
   * Sync platforms from JustWatch
   */
  async syncPlatforms() {
    try {
      logger.info('Syncing platforms from JustWatch...');
      
      const providers = await justWatchClient.getProviders();
      
      if (providers.length === 0) {
        logger.warn('No providers fetched from JustWatch');
        return [];
      }

      const platforms = [];

      for (const provider of providers) {
        const name = provider.clear_name || provider.short_name;

        const slug = slugify(name, {
          lower: true,
          strict: true
        });

        const platform = await platformRepository.findOrCreate({
          justWatchId: provider.id.toString(),
          name,
          slug, // ✅ FIX
          icon: provider.icon_url || null
        });

        platforms.push(platform);
      }

      logger.info(`Synced ${platforms.length} platforms from JustWatch`);
      return platforms;
    } catch (error) {
      logger.error('Error syncing platforms:', error);
      throw error;
    }
  }

  /**
   * Ingest movies from a specific platform
   */
  async ingestMoviesFromPlatform(platformId, maxPages = 10) {
    try {
      const platform = await platformRepository.findByJustWatchId(platformId);
      
      if (!platform) {
        logger.error(`Platform not found: ${platformId}`);
        return { movies: 0, availabilities: 0 };
      }

      logger.info(`Ingesting movies from platform: ${platform.name}`);

      const ingestionStartTime = new Date();
      let totalMovies = 0;
      let totalAvailabilities = 0;
      let page = 1;

      while (page <= maxPages) {
        logger.info(`Fetching page ${page} for ${platform.name}...`);

        const response = await justWatchClient.getTitlesByProvider(platformId, page);
        
        if (!response.items || response.items.length === 0) {
          logger.info(`No more items on page ${page}, stopping`);
          break;
        }

        for (const jwMovie of response.items) {
          try {
            const result = await this.processJustWatchMovie(jwMovie, platform);
            
            if (result) {
              totalMovies++;
              totalAvailabilities += result.availabilitiesCreated;
            }
          } catch (error) {
            logger.error(`Error processing movie ${jwMovie.id}:`, error.message);
          }
        }

        if (page >= response.total_pages) {
          logger.info(`Reached last page (${page})`);
          break;
        }

        page++;
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await availabilityRepository.markStaleAsUnavailable(
        platform._id,
        ingestionStartTime
      );

      logger.info(
        `Completed ingestion for ${platform.name}: ${totalMovies} movies, ${totalAvailabilities} availabilities`
      );

      return {
        movies: totalMovies,
        availabilities: totalAvailabilities
      };
    } catch (error) {
      logger.error(`Error ingesting from platform ${platformId}:`, error);
      throw error;
    }
  }

  /**
   * Process a single JustWatch movie
   */
  async processJustWatchMovie(jwMovie, platform) {
    try {
      const movieData = justWatchClient.normalizeMovieData(jwMovie);

      let movie = await movieRepository.findByJustWatchId(movieData.justWatchId);

      if (movie) {
        const updateData = {
          title: movieData.title,
          originalTitle: movieData.originalTitle,
          releaseYear: movieData.releaseYear
        };

        if (!movie.tmdbId && movieData.tmdbId) {
          updateData.tmdbId = movieData.tmdbId;
        }
        if (!movie.imdbId && movieData.imdbId) {
          updateData.imdbId = movieData.imdbId;
        }

        movie = await movieRepository.update(movie._id, updateData);
      } else {
        movie = await movieRepository.create(movieData);
        logger.debug(`Created new movie: ${movie.title}`);
      }

      const offers = justWatchClient.extractOffers(jwMovie);
      let availabilitiesCreated = 0;

      for (const offer of offers) {
        let offerPlatform = platform;
        
        if (offer.providerId && offer.providerId !== platform.justWatchId) {
          offerPlatform = await platformRepository.findByJustWatchId(
            offer.providerId
          );

          if (!offerPlatform && offer.providerName) {
            const slug = slugify(offer.providerName, {
              lower: true,
              strict: true
            });

            offerPlatform = await platformRepository.findOrCreate({
              justWatchId: offer.providerId,
              name: offer.providerName,
              slug // ✅ FIX
            });
          }
        }

        if (!offerPlatform) continue;

        await availabilityRepository.upsert({
          movie: movie._id,
          platform: offerPlatform._id,
          monetizationType: offer.monetizationType,
          quality: offer.quality,
          externalUrl: offer.url
        });

        availabilitiesCreated++;
      }

      return {
        movie,
        availabilitiesCreated
      };
    } catch (error) {
      logger.error(`Error processing JustWatch movie:`, error);
      throw error;
    }
  }

  /**
   * Ingest from multiple platforms
   */
  async ingestFromPlatforms(platformIds, maxPagesPerPlatform = 10) {
    logger.info(`Starting ingestion from ${platformIds.length} platforms...`);

    const results = [];

    for (const platformId of platformIds) {
      try {
        const result = await this.ingestMoviesFromPlatform(
          platformId,
          maxPagesPerPlatform
        );

        results.push({
          platformId,
          ...result
        });
      } catch (error) {
        logger.error(`Failed to ingest from platform ${platformId}:`, error);
        results.push({
          platformId,
          error: error.message
        });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const summary = results.reduce(
      (acc, r) => ({
        totalMovies: acc.totalMovies + (r.movies || 0),
        totalAvailabilities: acc.totalAvailabilities + (r.availabilities || 0),
        errors: acc.errors + (r.error ? 1 : 0)
      }),
      { totalMovies: 0, totalAvailabilities: 0, errors: 0 }
    );

    logger.info('Ingestion summary:', summary);
    return { results, summary };
  }

  /**
   * Ingest from all active platforms
   */
  async ingestFromAllPlatforms(maxPagesPerPlatform = 10) {
    try {
      const platforms = await platformRepository.findAllActive();
      
      if (platforms.length === 0) {
        logger.warn('No active platforms found');
        return { results: [], summary: {} };
      }

      const platformIds = platforms.map(p => p.justWatchId);
      return await this.ingestFromPlatforms(platformIds, maxPagesPerPlatform);
    } catch (error) {
      logger.error('Error ingesting from all platforms:', error);
      throw error;
    }
  }
}

module.exports = new JustWatchIngestion();
