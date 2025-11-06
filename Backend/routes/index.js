const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth');
const movieRoutes = require('./movies');
const reviewRoutes = require('./reviews');
const listRoutes = require('./lists');
const adminRoutes = require('./admin');

// Mount routes
router.use('/auth', authRoutes);
router.use('/movies', movieRoutes);
router.use('/reviews', reviewRoutes);
router.use('/lists', listRoutes);
router.use('/admin', adminRoutes);

// API info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'FilmRate API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      movies: '/api/movies',
      reviews: '/api/reviews',
      lists: '/api/lists',
      admin: '/api/admin'
    }
  });
});

module.exports = router;