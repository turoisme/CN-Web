const express = require('express');
const router = express.Router();
const {
  getAllMovies,
  getMovieById,
  searchMovies,
  filterMovies,
  getTrendingMovies,
  getTopRatedMovies
} = require('../controllers/movieController');
const { optionalAuth } = require('../middlewares/authMiddleware');
const { validateObjectId, validatePagination } = require('../middlewares/validationMiddleware');

// Public routes
router.get('/', optionalAuth, validatePagination, getAllMovies);
router.get('/search', optionalAuth, searchMovies);
router.get('/filter', optionalAuth, filterMovies);
router.get('/trending', getTrendingMovies);
router.get('/top-rated', getTopRatedMovies);
router.get('/:id', validateObjectId('id'), optionalAuth, getMovieById);

module.exports = router;