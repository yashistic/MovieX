const app = require('./src/app');
const config = require('./src/config/env');
const database = require('./src/config/database');
const catalogUpdateJob = require('./src/jobs/catalogUpdateJob');
const ingestionOrchestrator = require('./src/services/ingestion/IngestionOrchestrator');
const logger = require('./src/utils/logger');

async function startServer() {
  try {
    // Connect to database
    logger.info('Connecting to MongoDB...');
    await database.connect();

    // Bootstrap catalog if configured
    if (config.ingestion.bootstrapOnStart) {
      logger.info('Bootstrap mode enabled - running initial catalog setup...');
      
      // Get platform IDs from config or bootstrap all
      const platformIds = config.ingestion.bootstrapPlatforms.length > 0
        ? config.ingestion.bootstrapPlatforms
        : null;

      await ingestionOrchestrator.bootstrap(platformIds);
    }

    // Start scheduled job
    logger.info('Starting scheduled catalog update job...');
    catalogUpdateJob.start();

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info('=================================================');
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`API Base URL: http://localhost:${config.port}/api`);
      logger.info('=================================================');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, starting graceful shutdown...`);

      // Stop accepting new requests
      server.close(async () => {
        logger.info('HTTP server closed');

        // Stop cron job
        catalogUpdateJob.stop();

        // Close database connection
        await database.disconnect();

        logger.info('Graceful shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();