module.exports = {
  // App Configuration
  app: {
    name: 'FilmRate',
    version: '1.0.0',
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development'
  },

  // CORS Configuration
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  },

  // Rate Limiting
  rateLimit: {
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100
  },

  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  }
};