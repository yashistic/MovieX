const cron = require('node-cron');
const config = require('../config/env');
const ingestionOrchestrator = require('../services/ingestion/IngestionOrchestrator');
const logger = require('../utils/logger');

class CatalogUpdateJob {
  constructor() {
    this.job = null;
    this.isScheduled = false;
  }

  /**
   * Start the scheduled job
   */
  start() {
    if (this.isScheduled) {
      logger.warn('Catalog update job is already scheduled');
      return;
    }

    const cronSchedule = config.ingestion.cronSchedule;

    logger.info(`Scheduling catalog update job: ${cronSchedule}`);

    // Validate cron expression
    if (!cron.validate(cronSchedule)) {
      logger.error(`Invalid cron expression: ${cronSchedule}`);
      throw new Error('Invalid cron schedule');
    }

    this.job = cron.schedule(cronSchedule, async () => {
      logger.info('=================================================');
      logger.info('Cron job triggered: Starting catalog update');
      logger.info('=================================================');

      try {
        const result = await ingestionOrchestrator.updateCatalog();
        
        if (result.success) {
          logger.info('Scheduled catalog update completed successfully');
        } else {
          logger.error('Scheduled catalog update failed:', result.error);
        }
      } catch (error) {
        logger.error('Error during scheduled catalog update:', error);
      }
    });

    this.isScheduled = true;
    logger.info('Catalog update job scheduled successfully');
  }

  /**
   * Stop the scheduled job
   */
  stop() {
    if (this.job) {
      this.job.stop();
      this.isScheduled = false;
      logger.info('Catalog update job stopped');
    }
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      isScheduled: this.isScheduled,
      cronSchedule: config.ingestion.cronSchedule,
      orchestratorStatus: ingestionOrchestrator.getStatus()
    };
  }

  /**
   * Trigger manual update (for testing/admin)
   */
  async triggerManual() {
    logger.info('Manual catalog update triggered');
    
    try {
      const result = await ingestionOrchestrator.updateCatalog();
      return result;
    } catch (error) {
      logger.error('Manual catalog update failed:', error);
      throw error;
    }
  }
}

module.exports = new CatalogUpdateJob();