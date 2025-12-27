const Platform = require('../models/Platform');
const logger = require('../utils/logger');

class PlatformRepository {
  /**
   * Find platform by JustWatch ID
   */
  async findByJustWatchId(justWatchId) {
    try {
      return await Platform.findOne({ justWatchId });
    } catch (error) {
      logger.error('Error finding platform by JustWatch ID:', error);
      throw error;
    }
  }

  /**
   * Find platform by name
   */
  async findByName(name) {
    try {
      return await Platform.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    } catch (error) {
      logger.error('Error finding platform by name:', error);
      throw error;
    }
  }

  /**
   * Find or create platform
   */
  async findOrCreate(platformData) {
    try {
      const existing = await this.findByJustWatchId(platformData.justWatchId);
      
      if (existing) {
        return existing;
      }

      const platform = new Platform(platformData);
      await platform.save();
      
      logger.debug(`Created new platform: ${platform.name}`);
      return platform;
    } catch (error) {
      logger.error('Error in findOrCreate platform:', error);
      throw error;
    }
  }

  /**
   * Get all active platforms
   */
  async findAllActive() {
    try {
      return await Platform.find({ isActive: true }).sort({ name: 1 });
    } catch (error) {
      logger.error('Error finding active platforms:', error);
      throw error;
    }
  }

  /**
   * Get all platforms
   */
  async findAll() {
    try {
      return await Platform.find().sort({ name: 1 });
    } catch (error) {
      logger.error('Error finding all platforms:', error);
      throw error;
    }
  }

  /**
   * Update platform
   */
  async update(id, updateData) {
    try {
      return await Platform.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
    } catch (error) {
      logger.error('Error updating platform:', error);
      throw error;
    }
  }

  /**
   * Deactivate platform
   */
  async deactivate(id) {
    try {
      return await this.update(id, { isActive: false });
    } catch (error) {
      logger.error('Error deactivating platform:', error);
      throw error;
    }
  }
}

module.exports = new PlatformRepository();