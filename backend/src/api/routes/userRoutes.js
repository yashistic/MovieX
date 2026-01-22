const express = require('express');
const UserController = require('../controllers/UserController');
const { authenticate, sanitizeInput } = require('../../middleware/auth');

const router = express.Router();

// All user routes require authentication
router.use(authenticate);
router.use(sanitizeInput);

// User stats
router.get('/stats', UserController.getStats);

// Favorites
router.get('/favorites', UserController.getFavorites);
router.post('/favorites/:movieId', UserController.addToFavorites);
router.delete('/favorites/:movieId', UserController.removeFromFavorites);

// Watchlist
router.get('/watchlist', UserController.getWatchlist);
router.post('/watchlist/:movieId', UserController.addToWatchlist);
router.delete('/watchlist/:movieId', UserController.removeFromWatchlist);

// Watched
router.get('/watched', UserController.getWatched);
router.post('/watched/:movieId', UserController.markAsWatched);
router.delete('/watched/:movieId', UserController.removeFromWatched);

module.exports = router;
