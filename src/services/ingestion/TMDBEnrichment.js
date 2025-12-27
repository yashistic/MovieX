const tmdbClient = require('../external/TMDBClient');
const genreRepository = require('../../repositories/GenreRepository');
const movieRepository = require('../../repositories/MovieRepository');
const logger = require('../../utils/logger');

class TMDBEnrichment {
  /**
   * Sync all genres from TMDB
   */
  async syncGenres() {
    try {
      logger.info('Syncing genres from TMDB...');
      
      const tmdbGenres = await tmdbClient.getGenres();
      
      if (tmdbGenres.length === 0) {
        logger.warn('No genres fetched from TMDB');
        return [];
      }

      const genresData = tmdbGenres.map(g => ({
        tmdbId: g.id,
        name: g.name
      }));

      await genreRepository.bulkUpsert(genresData);
      
      logger.info(`Synced ${genresData.length} genres from TMDB`);
      return genresData;
    } catch (error) {
      logger.error('Error syncing TMDB genres:', error);
      throw error;
    }
  }

  /**
   * Enrich a single movie with TMDB data
   */
  async enrichMovie(movie) {
    try {
      logger.debug(`Enriching movie: ${movie.title} (${movie._id})`);

      let tmdbMovie = null;

      // Try to find by TMDB ID first
      if (movie.tmdbId) {
        tmdbMovie = await tmdbClient.getMovieDetails(movie.tmdbId);
      }

      // Try to find by IMDb ID
      if (!tmdbMovie && movie.imdbId) {
        const searchResult = await tmdbClient.findByImdbId(movie.imdbId);
        if (searchResult) {
          tmdbMovie = await tmdbClient.getMovieDetails(searchResult.id);
        }
      }

      // Try to search by title and year
      if (!tmdbMovie) {
        const searchResults = await tmdbClient.searchMovie(movie.title, movie.releaseYear);
        
        if (searchResults.length > 0) {
          // Take the first result (most relevant)
          const firstResult = searchResults[0];
          tmdbMovie = await tmdbClient.getMovieDetails(firstResult.id);
        }
      }

      if (!tmdbMovie) {
        logger.warn(`Could not find TMDB data for movie: ${movie.title}`);
        return null;
      }

      // Normalize and prepare update data
      const enrichmentData = tmdbClient.normalizeMovieData(tmdbMovie);

      // Resolve and map genres
      if (tmdbMovie.genres && tmdbMovie.genres.length > 0) {
        const genreIds = await this.resolveGenres(tmdbMovie.genres);
        enrichmentData.genres = genreIds;
      }

      // Update movie with enriched data
      const updatedMovie = await movieRepository.update(movie._id, enrichmentData);
      await movieRepository.markAsEnriched(movie._id);

      logger.info(`Successfully enriched movie: ${updatedMovie.title}`);
      return updatedMovie;
    } catch (error) {
      logger.error(`Error enriching movie ${movie.title}:`, error);
      return null;
    }
  }

  /**
   * Resolve TMDB genres to database genre IDs
   */
  async resolveGenres(tmdbGenres) {
    try {
      const genreIds = [];

      for (const tmdbGenre of tmdbGenres) {
        const genre = await genreRepository.findOrCreate({
          tmdbId: tmdbGenre.id,
          name: tmdbGenre.name
        });

        if (genre) {
          genreIds.push(genre._id);
        }
      }

      return genreIds;
    } catch (error) {
      logger.error('Error resolving genres:', error);
      return [];
    }
  }

  /**
   * Batch enrich movies
   */
  async enrichMovies(movies, batchSize = 10) {
    logger.info(`Starting batch enrichment for ${movies.length} movies...`);

    let enriched = 0;
    let failed = 0;

    for (let i = 0; i < movies.length; i += batchSize) {
      const batch = movies.slice(i, i + batchSize);
      
      logger.info(`Enriching batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(movies.length / batchSize)}`);

      for (const movie of batch) {
        const result = await this.enrichMovie(movie);
        if (result) {
          enriched++;
        } else {
          failed++;
        }
      }

      // Small delay between batches
      if (i + batchSize < movies.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    logger.info(`Batch enrichment complete: ${enriched} enriched, ${failed} failed`);
    
    return { enriched, failed };
  }

  /**
   * Enrich movies that need enrichment
   */
  async enrichPendingMovies(limit = 50) {
    try {
      logger.info('Finding movies that need enrichment...');
      
      const movies = await movieRepository.findNeedingEnrichment(limit);
      
      if (movies.length === 0) {
        logger.info('No movies need enrichment');
        return { enriched: 0, failed: 0 };
      }

      logger.info(`Found ${movies.length} movies needing enrichment`);
      
      return await this.enrichMovies(movies);
    } catch (error) {
      logger.error('Error enriching pending movies:', error);
      throw error;
    }
  }
}

module.exports = new TMDBEnrichment();