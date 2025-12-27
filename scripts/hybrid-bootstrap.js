require('dotenv').config();
const database = require('../src/config/database');
const tmdbClient = require('../src/services/external/TMDBClient');
const tmdbEnrichment = require('../src/services/ingestion/TMDBEnrichment');
const movieRepository = require('../src/repositories/MovieRepository');
const platformRepository = require('../src/repositories/PlatformRepository');
const availabilityRepository = require('../src/repositories/AvailabilityRepository');
const logger = require('../src/utils/logger');

async function hybridBootstrap() {
  try {
    await database.connect();
    
    // Sync genres
    await tmdbEnrichment.syncGenres();
    
    let totalMovies = 0;
    let totalAvailabilities = 0;
    
    for (let page = 1; page <= 5; page++) {
      logger.info(`Fetching page ${page}/5...`);
      
      const data = await tmdbClient.request('/movie/popular', { page });
      
      for (const tmdbMovie of data.results || []) {
        // Save movie
        const movieData = tmdbClient.normalizeMovieData(tmdbMovie);
        const movie = await movieRepository.upsertByJustWatchId({
          ...movieData,
          justWatchId: `tmdb_${tmdbMovie.id}`,
          isEnriched: true,
          lastEnrichedAt: new Date()
        });
        
        totalMovies++;
        
        // Get watch providers for India
        try {
          const providers = await tmdbClient.request(`/movie/${tmdbMovie.id}/watch/providers`);
          const indiaProviders = providers.results?.IN;
          
          if (indiaProviders) {
            // Process flatrate (subscription)
            for (const provider of indiaProviders.flatrate || []) {
              const platform = await platformRepository.findOrCreate({
                justWatchId: `tmdb_${provider.provider_id}`,
                name: provider.provider_name
              });
              
              await availabilityRepository.upsert({
                movie: movie._id,
                platform: platform._id,
                monetizationType: 'flatrate'
              });
              
              totalAvailabilities++;
            }
          }
        } catch (err) {
          // Skip if watch providers not available
        }
        
        logger.info(`  ✓ ${movie.title} (${movie.releaseYear})`);
      }
    }
    
    logger.info(`\n✅ Complete: ${totalMovies} movies, ${totalAvailabilities} availabilities`);
    
    await database.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Bootstrap failed:', error);
    process.exit(1);
  }
}

hybridBootstrap();