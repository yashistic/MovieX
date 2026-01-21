require('dotenv').config();
const database = require('../src/config/database');
const tmdbClient = require('../src/services/external/TMDBClient');
const Movie = require('../src/models/Movie');
const logger = require('../src/utils/logger');

async function updateRuntime() {
  try {
    await database.connect();

    const movies = await Movie.find({ runtime: null, tmdbId: { $ne: null } });
    logger.info(`Found ${movies.length} movies without runtime`);

    let updated = 0;
    for (const movie of movies) {
      try {
        const details = await tmdbClient.getMovieDetails(movie.tmdbId);
        if (details && details.runtime) {
          movie.runtime = details.runtime;
          await movie.save();
          updated++;
          logger.info(`Updated ${movie.title}: ${details.runtime} min`);
        }
        await new Promise(resolve => setTimeout(resolve, 250));
      } catch (err) {
        logger.error(`Error updating ${movie.title}:`, err.message);
      }
    }

    logger.info(`Updated ${updated} movies with runtime`);
    await database.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Update failed:', error);
    await database.disconnect();
    process.exit(1);
  }
}

updateRuntime();
