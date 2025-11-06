// User roles
const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

// Rating scales
const RATING_SCALE = {
  MIN: 1,
  MAX: 10
};

// Vote types
const VOTE_TYPES = {
  HELPFUL: 'helpful',
  UNHELPFUL: 'unhelpful'
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

// Response messages
const MESSAGES = {
  // Success
  SUCCESS: 'Operation successful',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  
  // Auth
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTER_SUCCESS: 'Registration successful',
  
  // Errors
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Not authorized to access this resource',
  FORBIDDEN: 'Access denied',
  VALIDATION_ERROR: 'Validation failed',
  SERVER_ERROR: 'Internal server error',
  
  // User
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_DEACTIVATED: 'Your account has been deactivated',
  
  // Movie
  MOVIE_NOT_FOUND: 'Movie not found',
  MOVIE_ALREADY_EXISTS: 'Movie already exists',
  
  // Review
  REVIEW_NOT_FOUND: 'Review not found',
  REVIEW_ALREADY_EXISTS: 'You have already reviewed this movie',
  CANNOT_REVIEW_OWN: 'You cannot review your own movie',
  
  // Rating
  RATING_NOT_FOUND: 'Rating not found',
  RATING_ALREADY_EXISTS: 'You have already rated this movie',
  
  // List
  LIST_NOT_FOUND: 'List not found',
  
  // Watchlist
  ALREADY_IN_WATCHLIST: 'Movie already in watchlist',
  NOT_IN_WATCHLIST: 'Movie not in watchlist'
};

// HTTP Status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
};

// Movie genres (predefined)
const GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Biography',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'History',
  'Horror',
  'Music',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Sport',
  'Thriller',
  'War',
  'Western'
];

// Sort options
const SORT_OPTIONS = {
  NEWEST: '-createdAt',
  OLDEST: 'createdAt',
  HIGHEST_RATED: '-averageRating',
  LOWEST_RATED: 'averageRating',
  MOST_REVIEWED: '-totalReviews',
  MOST_VIEWED: '-views',
  TITLE_ASC: 'title',
  TITLE_DESC: '-title',
  YEAR_ASC: 'releaseYear',
  YEAR_DESC: '-releaseYear'
};

// Filter options
const FILTER_OPTIONS = {
  ALL: 'all',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PUBLIC: 'public',
  PRIVATE: 'private'
};

module.exports = {
  USER_ROLES,
  RATING_SCALE,
  VOTE_TYPES,
  PAGINATION,
  MESSAGES,
  HTTP_STATUS,
  GENRES,
  SORT_OPTIONS,
  FILTER_OPTIONS
};