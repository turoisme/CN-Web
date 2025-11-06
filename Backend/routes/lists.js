const express = require('express');
const router = express.Router();
const {
  createList,
  getAllLists,
  getListById,
  getUserLists,
  updateList,
  deleteList,
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  getSimilarMovies
} = require('../controllers/listController');
const { protect, optionalAuth } = require('../middlewares/authMiddleware');
const { validateObjectId } = require('../middlewares/validationMiddleware');

// Public routes
router.get('/', optionalAuth, getAllLists);
router.get('/similar/:movieId', validateObjectId('movieId'), getSimilarMovies);
router.get('/user/:userId', validateObjectId('userId'), optionalAuth, getUserLists);
router.get('/:id', validateObjectId('id'), optionalAuth, getListById);

// Protected routes
router.use(protect);

// Custom lists
router.post('/', createList);
router.put('/:id', validateObjectId('id'), updateList);
router.delete('/:id', validateObjectId('id'), deleteList);

// Watchlist
router.get('/watchlist/me', getWatchlist);
router.post('/watchlist/:movieId', validateObjectId('movieId'), addToWatchlist);
router.delete('/watchlist/:movieId', validateObjectId('movieId'), removeFromWatchlist);

module.exports = router;