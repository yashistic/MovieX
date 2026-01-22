const User = require('../../models/User');
const logger = require('../../utils/logger');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  JWT_REFRESH_EXPIRES_IN
} = require('../../middleware/auth');

/**
 * Parse duration string to milliseconds
 */
const parseDuration = (duration) => {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
};

class AuthController {
  /**
   * Register a new user
   * POST /api/auth/signup
   */
  async signup(req, res) {
    try {
      const { email, password, name } = req.body;

      // Validate required fields
      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          error: 'Please provide email, password, and name.'
        });
      }

      // Check password strength
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters long.'
        });
      }

      // Check for password complexity
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);

      if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        return res.status(400).json({
          success: false,
          error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email already exists.'
        });
      }

      // Create new user
      const user = await User.create({
        email,
        password,
        name
      });

      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Store refresh token
      const refreshExpiry = parseDuration(JWT_REFRESH_EXPIRES_IN);
      await User.findByIdAndUpdate(user._id, {
        $push: {
          refreshTokens: {
            token: refreshToken,
            expiresAt: new Date(Date.now() + refreshExpiry),
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip
          }
        },
        lastLogin: Date.now()
      });

      logger.info(`New user registered: ${user.email}`);

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Signup error:', error);

      // Handle mongoose validation errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(e => e.message);
        return res.status(400).json({
          success: false,
          error: messages.join('. ')
        });
      }

      // Handle duplicate key error
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email already exists.'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create account. Please try again.'
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Please provide email and password.'
        });
      }

      // Find user with password
      const user = await User.findByEmail(email);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password.'
        });
      }

      // Check if account is locked
      if (user.isLocked) {
        const lockRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
        return res.status(423).json({
          success: false,
          error: `Account is locked. Please try again in ${lockRemaining} minutes.`
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Account has been deactivated. Please contact support.'
        });
      }

      // Verify password
      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        // Increment failed login attempts
        await user.incLoginAttempts();

        return res.status(401).json({
          success: false,
          error: 'Invalid email or password.'
        });
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Store refresh token (limit to 5 active sessions)
      const refreshExpiry = parseDuration(JWT_REFRESH_EXPIRES_IN);

      await User.findByIdAndUpdate(user._id, {
        $push: {
          refreshTokens: {
            $each: [{
              token: refreshToken,
              expiresAt: new Date(Date.now() + refreshExpiry),
              userAgent: req.headers['user-agent'],
              ipAddress: req.ip
            }],
            $slice: -5 // Keep only last 5 tokens
          }
        }
      });

      logger.info(`User logged in: ${user.email}`);

      res.json({
        success: true,
        message: 'Login successful.',
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed. Please try again.'
      });
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;

      if (req.user && refreshToken) {
        // Remove the specific refresh token
        await User.findByIdAndUpdate(req.user._id, {
          $pull: {
            refreshTokens: { token: refreshToken }
          }
        });
      }

      logger.info(`User logged out: ${req.user?.email || 'unknown'}`);

      res.json({
        success: true,
        message: 'Logged out successfully.'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed.'
      });
    }
  }

  /**
   * Logout from all devices
   * POST /api/auth/logout-all
   */
  async logoutAll(req, res) {
    try {
      await User.findByIdAndUpdate(req.user._id, {
        $set: { refreshTokens: [] }
      });

      logger.info(`User logged out from all devices: ${req.user.email}`);

      res.json({
        success: true,
        message: 'Logged out from all devices successfully.'
      });
    } catch (error) {
      logger.error('Logout all error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to logout from all devices.'
      });
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required.'
        });
      }

      // Verify refresh token
      const decoded = verifyToken(refreshToken);

      if (!decoded || decoded.type !== 'refresh') {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token.'
        });
      }

      // Find user and check if refresh token exists
      const user = await User.findById(decoded.id).select('+refreshTokens');

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found.'
        });
      }

      // Check if refresh token is in the stored tokens
      const tokenExists = user.refreshTokens?.some(
        t => t.token === refreshToken && t.expiresAt > new Date()
      );

      if (!tokenExists) {
        return res.status(401).json({
          success: false,
          error: 'Refresh token expired or revoked.'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Account has been deactivated.'
        });
      }

      // Generate new access token
      const newAccessToken = generateAccessToken(user._id);

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken
        }
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to refresh token.'
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user._id)
        .populate('favorites', 'title posterPath releaseDate voteAverage')
        .populate('watchlist', 'title posterPath releaseDate voteAverage')
        .populate('watched.movie', 'title posterPath releaseDate voteAverage');

      res.json({
        success: true,
        data: {
          user
        }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile.'
      });
    }
  }

  /**
   * Update user profile
   * PATCH /api/auth/me
   */
  async updateProfile(req, res) {
    try {
      const allowedUpdates = ['name', 'avatar'];
      const updates = {};

      for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update.'
        });
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        updates,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'Profile updated successfully.',
        data: { user }
      });
    } catch (error) {
      logger.error('Update profile error:', error);

      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(e => e.message);
        return res.status(400).json({
          success: false,
          error: messages.join('. ')
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update profile.'
      });
    }
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Please provide current password and new password.'
        });
      }

      // Check new password strength
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'New password must be at least 8 characters long.'
        });
      }

      const hasUpperCase = /[A-Z]/.test(newPassword);
      const hasLowerCase = /[a-z]/.test(newPassword);
      const hasNumbers = /\d/.test(newPassword);

      if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        return res.status(400).json({
          success: false,
          error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
        });
      }

      // Get user with password
      const user = await User.findById(req.user._id).select('+password');

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect.'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Invalidate all refresh tokens (force re-login on all devices)
      await User.findByIdAndUpdate(user._id, {
        $set: { refreshTokens: [] }
      });

      // Generate new tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      const refreshExpiry = parseDuration(JWT_REFRESH_EXPIRES_IN);
      await User.findByIdAndUpdate(user._id, {
        $push: {
          refreshTokens: {
            token: refreshToken,
            expiresAt: new Date(Date.now() + refreshExpiry),
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip
          }
        }
      });

      logger.info(`Password changed for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Password changed successfully.',
        data: {
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to change password.'
      });
    }
  }

  /**
   * Delete account
   * DELETE /api/auth/me
   */
  async deleteAccount(req, res) {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          error: 'Please provide your password to confirm account deletion.'
        });
      }

      // Get user with password
      const user = await User.findById(req.user._id).select('+password');

      // Verify password
      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Password is incorrect.'
        });
      }

      // Soft delete - deactivate account
      await User.findByIdAndUpdate(user._id, {
        isActive: false,
        email: `deleted_${user._id}_${user.email}`,
        refreshTokens: []
      });

      logger.info(`Account deleted: ${user.email}`);

      res.json({
        success: true,
        message: 'Account deleted successfully.'
      });
    } catch (error) {
      logger.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete account.'
      });
    }
  }
}

module.exports = new AuthController();
