const express = require('express');
const movieController = require('../controllers/MovieController');

const router = express.Router();

// Movies
router.get('/movies', movieController.getMovies.bind(movieController));
router.get('/movies/:id', movieController.getMovieById.bind(movieController));

// Genre-based queries
router.get('/genres', movieController.getGenres.bind(movieController));
router.get('/genres/:genreSlug/movies', movieController.getMoviesByGenre.bind(movieController));

// Platform-based queries
router.get('/platforms', movieController.getPlatforms.bind(movieController));
router.get('/platforms/:platformSlug/movies', movieController.getMoviesByPlatform.bind(movieController));

// Statistics
router.get('/statistics', movieController.getStatistics.bind(movieController));

module.exports = router;