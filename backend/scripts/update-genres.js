require('dotenv').config();
const database = require('../src/config/database');
const tmdbClient = require('../src/services/external/TMDBClient');
const Movie = require('../src/models/Movie');
const Genre = require('../src/models/Genre');
const logger = require('../src/utils/logger');

async function updateGenres() {
  try {
    await database.connect();

    // Get all genres from database
    const allGenres = await Genre.find({});
    const genreMap = new Map();
    allGenres.forEach(g => genreMap.set(g.tmdbId, g._id));
    logger.info(`Loaded ${allGenres.length} genres`);

    // Find movies without genres
    const movies = await Movie.find({ 
      $or: [{ genres: { $size: 0 } }, { genres: { $exists: false } }],
      tmdbId: { $ne: null }
    });
    logger.info(`Found ${movies.length} movies without genres`);

    let updated = 0;
    for (const movie of movies) {
      try {
        const details = await tmdbClient.getMovieDetails(movie.tmdbId);
        if (details && details.genres && details.genres.length > 0) {
          const genreIds = details.genres
            .map(g => genreMap.get(g.id))
            .filter(id => id !== undefined);
          
          if (genreIds.length > 0) {
            movie.genres = genreIds;
            await movie.save();
            updated++;
            const genreNames = details.genres.map(g => g.name).join(', ');
            logger.info(`Updated ${movie.title}: ${genreNames}`);
          }
        }
        await new Promise(resolve => setTimeout(resolve, 250));
      } catch (err) {
        logger.error(`Error updating ${movie.title}:`, err.message);
      }
    }

    logger.info(`Updated ${updated} movies with genres`);
    await database.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Update failed:', error);
    await database.disconnect();
    process.exit(1);
  }
}

updateGenres();
