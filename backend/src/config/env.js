require('dotenv').config();

const requiredEnvVars = [
  'MONGODB_URI',
  'TMDB_API_KEY',
  'TMDB_BASE_URL',
  'JUSTWATCH_BASE_URL'
];

// Validate required environment variables
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

module.exports = {
  // MongoDB
  mongoUri: process.env.MONGODB_URI,
  mongoTestUri: process.env.MONGODB_TEST_URI,

  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // TMDB
  tmdb: {
    apiKey: process.env.TMDB_API_KEY,
    baseUrl: process.env.TMDB_BASE_URL,
    requestsPerSecond: parseInt(process.env.TMDB_REQUESTS_PER_SECOND || '4', 10)
  },

  // JustWatch
  justWatch: {
    baseUrl: process.env.JUSTWATCH_BASE_URL,
    region: process.env.JUSTWATCH_REGION || 'en_IN',
    language: process.env.JUSTWATCH_LANGUAGE || 'en',
    requestsPerSecond: parseInt(process.env.JUSTWATCH_REQUESTS_PER_SECOND || '2', 10)
  },

  // Ingestion
  ingestion: {
    cronSchedule: process.env.INGESTION_CRON_SCHEDULE || '0 */6 * * *',
    bootstrapOnStart: process.env.BOOTSTRAP_ON_START === 'true',
    bootstrapPlatforms: (process.env.BOOTSTRAP_PLATFORMS || '').split(',').map(p => p.trim())
  },

  // Retry Configuration
  retry: {
    maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
    delayMs: parseInt(process.env.RETRY_DELAY_MS || '1000', 10)
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info'
};