require('dotenv').config();
const justWatchClient = require('../src/services/external/JustWatchClient');
const logger = require('../src/utils/logger');

async function testJustWatch() {
  try {
    logger.info('Testing JustWatch GraphQL API...\n');

    // Test 1: Get providers
    logger.info('Test 1: Fetching providers...');
    const providers = await justWatchClient.getProviders();
    logger.info(`✓ Found ${providers.length} providers`);
    
    if (providers.length > 0) {
      logger.info('Sample providers:');
      providers.slice(0, 5).forEach(p => {
        logger.info(`  - ${p.clearName || p.shortName} (ID: ${p.packageId || p.id})`);
      });
    }

    // Test 2: Get popular movies
    logger.info('\nTest 2: Fetching popular movies...');
    const result = await justWatchClient.searchTitlesGraphQL({
      page: 1,
      pageSize: 5
    });
    
    logger.info(`✓ Found ${result.items.length} movies`);
    
    if (result.items.length > 0) {
      logger.info('Sample movies:');
      result.items.forEach(m => {
        logger.info(`  - ${m.title} (${m.original_release_year})`);
      });
    }

    // Test 3: Get movies from Netflix
    if (providers.length > 0) {
      const netflix = providers.find(p => 
        (p.clearName || p.shortName || '').toLowerCase().includes('netflix')
      );
      
      if (netflix) {
        logger.info('\nTest 3: Fetching Netflix movies...');
        const netflixResult = await justWatchClient.getTitlesByProvider(
          netflix.packageId || netflix.id,
          1,
          5
        );
        
        logger.info(`✓ Found ${netflixResult.items.length} Netflix movies`);
        
        if (netflixResult.items.length > 0) {
          logger.info('Sample Netflix movies:');
          netflixResult.items.forEach(m => {
            logger.info(`  - ${m.title} (${m.original_release_year})`);
          });
        }
      }
    }

    logger.info('\n✅ All tests passed! JustWatch API is working!');
    
  } catch (error) {
    logger.error('❌ Test failed:', error);
  }
}

testJustWatch();