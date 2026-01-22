const User = require('../../models/User');
const Movie = require('../../models/Movie');
const logger = require('../../utils/logger');

class UserController {
  /**
   * Get user's favorites
   * GET /api/user/favorites
   */
  async getFavorites(req, res) {
    try {
      const user = await User.findById(req.user._id)
        .populate('favorites', 'title posterPath backdropPath releaseDate voteAverage overview genres');

      res.json({
        success: true,
        data: {
          favorites: user.favorites || []
        }
      });
    } catch (error) {
      logger.error('Get favorites error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get favorites.'
      });
    }
  }

  /**
   * Add movie to favorites
   * POST /api/user/favorites/:movieId
   */
  async addToFavorites(req, res) {
    try {
      const { movieId } = req.params;

      // Check if movie exists
      const movie = await Movie.findById(movieId);
      if (!movie) {
        return res.status(404).json({
          success: false,
          error: 'Movie not found.'
        });
      }

      // Check if already in favorites
      const user = await User.findById(req.user._id);
      if (user.favorites.includes(movieId)) {
        return res.status(400).json({
          success: false,
          error: 'Movie is already in favorites.'
        });
      }

      // Add to favorites
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { favorites: movieId }
      });

      res.json({
        success: true,
        message: 'Movie added to favorites.'
      });
    } catch (error) {
      logger.error('Add to favorites error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add to favorites.'
      });
    }
  }

  /**
   * Remove movie from favorites
   * DELETE /api/user/favorites/:movieId
   */
  async removeFromFavorites(req, res) {
    try {
      const { movieId } = req.params;

      await User.findByIdAndUpdate(req.user._id, {
        $pull: { favorites: movieId }
      });

      res.json({
        success: true,
        message: 'Movie removed from favorites.'
      });
    } catch (error) {
      logger.error('Remove from favorites error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove from favorites.'
      });
    }
  }

  /**
   * Get user's watchlist
   * GET /api/user/watchlist
   */
  async getWatchlist(req, res) {
    try {
      const user = await User.findById(req.user._id)
        .populate('watchlist', 'title posterPath backdropPath releaseDate voteAverage overview genres');

      res.json({
        success: true,
        data: {
          watchlist: user.watchlist || []
        }
      });
    } catch (error) {
      logger.error('Get watchlist error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get watchlist.'
      });
    }
  }

  /**
   * Add movie to watchlist
   * POST /api/user/watchlist/:movieId
   */
  async addToWatchlist(req, res) {
    try {
      const { movieId } = req.params;

      // Check if movie exists
      const movie = await Movie.findById(movieId);
      if (!movie) {
        return res.status(404).json({
          success: false,
          error: 'Movie not found.'
        });
      }

      // Check if already in watchlist
      const user = await User.findById(req.user._id);
      if (user.watchlist.includes(movieId)) {
        return res.status(400).json({
          success: false,
          error: 'Movie is already in watchlist.'
        });
      }

      // Add to watchlist
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { watchlist: movieId }
      });

      res.json({
        success: true,
        message: 'Movie added to watchlist.'
      });
    } catch (error) {
      logger.error('Add to watchlist error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add to watchlist.'
      });
    }
  }

  /**
   * Remove movie from watchlist
   * DELETE /api/user/watchlist/:movieId
   */
  async removeFromWatchlist(req, res) {
    try {
      const { movieId } = req.params;

      await User.findByIdAndUpdate(req.user._id, {
        $pull: { watchlist: movieId }
      });

      res.json({
        success: true,
        message: 'Movie removed from watchlist.'
      });
    } catch (error) {
      logger.error('Remove from watchlist error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove from watchlist.'
      });
    }
  }

  /**
   * Get user's watched movies
   * GET /api/user/watched
   */
  async getWatched(req, res) {
    try {
      const user = await User.findById(req.user._id)
        .populate('watched.movie', 'title posterPath backdropPath releaseDate voteAverage overview genres');

      res.json({
        success: true,
        data: {
          watched: user.watched || []
        }
      });
    } catch (error) {
      logger.error('Get watched error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get watched movies.'
      });
    }
  }

  /**
   * Mark movie as watched
   * POST /api/user/watched/:movieId
   */
  async markAsWatched(req, res) {
    try {
      const { movieId } = req.params;
      const { rating } = req.body;

      // Check if movie exists
      const movie = await Movie.findById(movieId);
      if (!movie) {
        return res.status(404).json({
          success: false,
          error: 'Movie not found.'
        });
      }

      // Check if already watched
      const user = await User.findById(req.user._id);
      const existingIndex = user.watched.findIndex(
        w => w.movie.toString() === movieId
      );

      if (existingIndex !== -1) {
        // Update existing watched entry
        const updatePath = `watched.${existingIndex}`;
        const updateData = {
          [`${updatePath}.watchedAt`]: new Date()
        };

        if (rating !== undefined) {
          if (rating < 1 || rating > 10) {
            return res.status(400).json({
              success: false,
              error: 'Rating must be between 1 and 10.'
            });
          }
          updateData[`${updatePath}.rating`] = rating;
        }

        await User.findByIdAndUpdate(req.user._id, { $set: updateData });

        return res.json({
          success: true,
          message: 'Watched entry updated.'
        });
      }

      // Add new watched entry
      const watchedEntry = {
        movie: movieId,
        watchedAt: new Date()
      };

      if (rating !== undefined) {
        if (rating < 1 || rating > 10) {
          return res.status(400).json({
            success: false,
            error: 'Rating must be between 1 and 10.'
          });
        }
        watchedEntry.rating = rating;
      }

      await User.findByIdAndUpdate(req.user._id, {
        $push: { watched: watchedEntry }
      });

      // Remove from watchlist if present
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { watchlist: movieId }
      });

      res.json({
        success: true,
        message: 'Movie marked as watched.'
      });
    } catch (error) {
      logger.error('Mark as watched error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark as watched.'
      });
    }
  }

  /**
   * Remove movie from watched
   * DELETE /api/user/watched/:movieId
   */
  async removeFromWatched(req, res) {
    try {
      const { movieId } = req.params;

      await User.findByIdAndUpdate(req.user._id, {
        $pull: { watched: { movie: movieId } }
      });

      res.json({
        success: true,
        message: 'Movie removed from watched.'
      });
    } catch (error) {
      logger.error('Remove from watched error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove from watched.'
      });
    }
  }

  /**
   * Get user stats
   * GET /api/user/stats
   */
  async getStats(req, res) {
    try {
      const user = await User.findById(req.user._id);

      res.json({
        success: true,
        data: {
          stats: {
            favorites: user.favorites?.length || 0,
            watchlist: user.watchlist?.length || 0,
            watched: user.watched?.length || 0
          }
        }
      });
    } catch (error) {
      logger.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get stats.'
      });
    }
  }
}

module.exports = new UserController();
