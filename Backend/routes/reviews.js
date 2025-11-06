const express = require('express');
const router = express.Router();
const {
  createRating,
  createReview,
  getMovieReviews,
  updateReview,
  deleteReview,
  voteReview
} = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');
const { validateReview, validateObjectId } = require('../middlewares/validationMiddleware');
const { createLimiter } = require('../middlewares/rateLimiter');

// Public routes
router.get('/movie/:movieId', validateObjectId('movieId'), getMovieReviews);

// Protected routes
router.use(protect);

router.post('/rating', createLimiter, createRating);
router.post('/', createLimiter, validateReview, createReview);
router.put('/:id', validateObjectId('id'), validateReview, updateReview);
router.delete('/:id', validateObjectId('id'), deleteReview);
router.post('/:id/vote', validateObjectId('id'), voteReview);

module.exports = router;