const config = require('../config/env');

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLevel = LOG_LEVELS[config.logLevel] || LOG_LEVELS.info;

class Logger {
  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ' ' + JSON.stringify(args) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
  }

  error(message, ...args) {
    if (currentLevel >= LOG_LEVELS.error) {
      console.error(this.formatMessage('error', message, ...args));
    }
  }

  warn(message, ...args) {
    if (currentLevel >= LOG_LEVELS.warn) {
      console.warn(this.formatMessage('warn', message, ...args));
    }
  }

  info(message, ...args) {
    if (currentLevel >= LOG_LEVELS.info) {
      console.log(this.formatMessage('info', message, ...args));
    }
  }

  debug(message, ...args) {
    if (currentLevel >= LOG_LEVELS.debug) {
      console.log(this.formatMessage('debug', message, ...args));
    }
  }
}

module.exports = new Logger();