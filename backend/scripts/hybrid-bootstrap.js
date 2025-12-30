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
    logger.info('Syncing genres...');
    await tmdbEnrichment.syncGenres();
    
    let totalMovies = 0;
    let totalAvailabilities = 0;
    
    // Define multiple movie sources
    const movieSources = [
      { name: 'Popular', endpoint: '/movie/popular' },
      { name: 'Top Rated', endpoint: '/movie/top_rated' },
      { name: 'Now Playing', endpoint: '/movie/now_playing' },
      { name: 'Upcoming', endpoint: '/movie/upcoming' }
    ];
    
    const pagesPerSource = 5;
    
    // Fetch from each source
    for (const source of movieSources) {
      logger.info(`\n📺 Fetching ${source.name} movies...`);
      
      for (let page = 1; page <= pagesPerSource; page++) {
        logger.info(`  Page ${page}/${pagesPerSource}...`);
        
        try {
          const data = await tmdbClient.request(source.endpoint, { page });
          
          for (const tmdbMovie of data.results || []) {
            try {
              // Check if movie already exists
              const existing = await movieRepository.findByTmdbId(tmdbMovie.id);
              
              if (existing) {
                logger.debug(`  ⏭️  Skipping existing: ${tmdbMovie.title}`);
                continue;
              }
              
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
                  // Process all monetization types
                  const monetizationTypes = [
                    { key: 'flatrate', type: 'flatrate' },
                    { key: 'rent', type: 'rent' },
                    { key: 'buy', type: 'buy' },
                    { key: 'ads', type: 'ads' },
                    { key: 'free', type: 'free' }
                  ];
                  
                  for (const monType of monetizationTypes) {
                    for (const provider of indiaProviders[monType.key] || []) {
                      const platform = await platformRepository.findOrCreate({
                        justWatchId: `tmdb_${provider.provider_id}`,
                        name: provider.provider_name
                      });
                      
                      await availabilityRepository.upsert({
                        movie: movie._id,
                        platform: platform._id,
                        monetizationType: monType.type
                      });
                      
                      totalAvailabilities++;
                    }
                  }
                }
              } catch (err) {
                logger.debug(`  No watch providers for ${tmdbMovie.title}`);
              }
              
              logger.info(`  ✓ ${movie.title} (${movie.releaseYear})`);
              
            } catch (err) {
              logger.error(`  ✗ Error processing ${tmdbMovie.title}:`, err.message);
            }
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (err) {
          logger.error(`Error fetching page ${page} from ${source.name}:`, err.message);
        }
      }
    }
    
    logger.info('\n=================================================');
    logger.info('✅ BOOTSTRAP COMPLETE');
    logger.info('=================================================');
    logger.info(`New movies added: ${totalMovies}`);
    logger.info(`Availabilities created: ${totalAvailabilities}`);
    logger.info('=================================================');
    
    await database.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Bootstrap failed:', error);
    await database.disconnect();
    process.exit(1);
  }
}

hybridBootstrap();