const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      this.connection = await mongoose.connect(config.mongoUri, options);
      
      logger.info('MongoDB connected successfully');
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      return this.connection;
    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      logger.info('MongoDB disconnected successfully');
    }
  }

  async dropDatabase() {
    if (config.nodeEnv !== 'production') {
      await mongoose.connection.dropDatabase();
      logger.info('Database dropped successfully');
    } else {
      throw new Error('Cannot drop database in production environment');
    }
  }
}

module.exports = new Database();