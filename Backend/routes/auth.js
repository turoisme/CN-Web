const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const {
  validateRegister,
  validateLogin
} = require('../middlewares/validationMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');

// Public routes
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);

// Protected routes
router.use(protect);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/logout', logout);

module.exports = router;