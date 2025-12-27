require('dotenv').config();
const database = require('../src/config/database');
const ingestionOrchestrator = require('../src/services/ingestion/IngestionOrchestrator');
const logger = require('../src/utils/logger');

/**
 * Bootstrap script to initialize catalog
 * 
 * Usage:
 *   node scripts/bootstrap.js
 *   node scripts/bootstrap.js --platforms "Netflix,Amazon Prime Video"
 *   node scripts/bootstrap.js --max-pages 30
 */

async function bootstrap() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let platformIds = null;
    let maxPages = 20;

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--platforms' && args[i + 1]) {
        platformIds = args[i + 1].split(',').map(p => p.trim());
        i++;
      } else if (args[i] === '--max-pages' && args[i + 1]) {
        maxPages = parseInt(args[i + 1]);
        i++;
      }
    }

    logger.info('=================================================');
    logger.info('CATALOG BOOTSTRAP SCRIPT');
    logger.info('=================================================');
    
    if (platformIds) {
      logger.info(`Target platforms: ${platformIds.join(', ')}`);
    } else {
      logger.info('Target platforms: ALL');
    }
    
    logger.info(`Max pages per platform: ${maxPages}`);
    logger.info('=================================================');

    // Connect to database
    logger.info('Connecting to database...');
    await database.connect();

    // Run bootstrap
    logger.info('Starting bootstrap process...');
    const result = await ingestionOrchestrator.bootstrap(platformIds, maxPages);

    if (result.success) {
      logger.info('=================================================');
      logger.info('✓ BOOTSTRAP COMPLETED SUCCESSFULLY');
      logger.info('=================================================');
      logger.info('Summary:');
      logger.info(`- Platforms synced: ${result.platformsSync?.count || 0}`);
      logger.info(`- Genres synced: ${result.genresSync?.count || 0}`);
      logger.info(`- Movies ingested: ${result.moviesIngestion?.totalMovies || 0}`);
      logger.info(`- Availabilities created: ${result.moviesIngestion?.totalAvailabilities || 0}`);
      logger.info(`- Movies enriched: ${result.moviesEnrichment?.enriched || 0}`);
      logger.info(`- Duration: ${Math.round(result.duration / 1000)}s`);
      logger.info('=================================================');
    } else {
      logger.error('Bootstrap failed:', result.error);
      process.exit(1);
    }

    // Disconnect
    await database.disconnect();
    
    logger.info('Bootstrap script complete');
    process.exit(0);

  } catch (error) {
    logger.error('Bootstrap script failed:', error);
    await database.disconnect();
    process.exit(1);
  }
}

// Run bootstrap
bootstrap();