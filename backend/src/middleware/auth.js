const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate access token
 */
const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
};

/**
 * Verify token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Extract token from Authorization header
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Also check cookies for token
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

/**
 * Authentication middleware - Protects routes requiring authentication
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in.'
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token. Please log in again.'
      });
    }

    // Check token type
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token type.'
      });
    }

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found. Please log in again.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account has been deactivated.'
      });
    }

    // Check if user changed password after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        error: 'Password was changed. Please log in again.'
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed.'
    });
  }
};

/**
 * Optional authentication - Attaches user if token present, but doesn't block
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = verifyToken(token);

      if (decoded && decoded.type === 'access') {
        const user = await User.findById(decoded.id);

        if (user && user.isActive && !user.changedPasswordAfter(decoded.iat)) {
          req.user = user;
          req.userId = user._id;
        }
      }
    }

    next();
  } catch (error) {
    // Silently continue without auth
    next();
  }
};

/**
 * Authorization middleware - Restricts access to specific roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to perform this action.'
      });
    }

    next();
  };
};

/**
 * Rate limiting for auth routes
 */
const authRateLimiter = (() => {
  const attempts = new Map();
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const MAX_ATTEMPTS = 10;

  // Cleanup old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of attempts.entries()) {
      if (now - data.firstAttempt > WINDOW_MS) {
        attempts.delete(key);
      }
    }
  }, 60000); // Cleanup every minute

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `auth_${ip}`;
    const now = Date.now();

    const current = attempts.get(key);

    if (!current) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return next();
    }

    // Reset if window has passed
    if (now - current.firstAttempt > WINDOW_MS) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return next();
    }

    // Check if limit exceeded
    if (current.count >= MAX_ATTEMPTS) {
      const retryAfter = Math.ceil((current.firstAttempt + WINDOW_MS - now) / 1000);
      res.set('Retry-After', retryAfter);
      return res.status(429).json({
        success: false,
        error: 'Too many authentication attempts. Please try again later.',
        retryAfter
      });
    }

    current.count++;
    next();
  };
})();

/**
 * Sanitize user input to prevent injection attacks
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize common attack vectors
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove null bytes
      return obj.replace(/\0/g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key of Object.keys(obj)) {
        // Prevent MongoDB operator injection
        if (key.startsWith('$')) {
          delete obj[key];
        } else {
          obj[key] = sanitize(obj[key]);
        }
      }
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  authRateLimiter,
  sanitizeInput,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN
};
