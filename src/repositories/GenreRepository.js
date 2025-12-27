const Genre = require('../models/Genre');
const logger = require('../utils/logger');

class GenreRepository {
  /**
   * Find genre by TMDB ID
   */
  async findByTmdbId(tmdbId) {
    try {
      return await Genre.findOne({ tmdbId });
    } catch (error) {
      logger.error('Error finding genre by TMDB ID:', error);
      throw error;
    }
  }

  /**
   * Find genre by name
   */
  async findByName(name) {
    try {
      return await Genre.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    } catch (error) {
      logger.error('Error finding genre by name:', error);
      throw error;
    }
  }

  /**
   * Find or create genre
   */
  async findOrCreate(genreData) {
    try {
      const existing = await this.findByTmdbId(genreData.tmdbId);
      
      if (existing) {
        return existing;
      }

      const genre = new Genre(genreData);
      await genre.save();
      
      logger.debug(`Created new genre: ${genre.name}`);
      return genre;
    } catch (error) {
      logger.error('Error in findOrCreate genre:', error);
      throw error;
    }
  }

  /**
   * Bulk upsert genres
   */
  async bulkUpsert(genresData) {
    try {
      const operations = genresData.map(genreData => ({
        updateOne: {
          filter: { tmdbId: genreData.tmdbId },
          update: { $set: genreData },
          upsert: true
        }
      }));

      const result = await Genre.bulkWrite(operations);
      logger.debug(`Bulk upserted ${result.upsertedCount} genres, modified ${result.modifiedCount}`);
      
      return result;
    } catch (error) {
      logger.error('Error in bulk upsert genres:', error);
      throw error;
    }
  }

  /**
   * Get all genres
   */
  async findAll() {
    try {
      return await Genre.find().sort({ name: 1 });
    } catch (error) {
      logger.error('Error finding all genres:', error);
      throw error;
    }
  }

  /**
   * Find genres by IDs
   */
  async findByIds(ids) {
    try {
      return await Genre.find({ _id: { $in: ids } });
    } catch (error) {
      logger.error('Error finding genres by IDs:', error);
      throw error;
    }
  }
}

module.exports = new GenreRepository();