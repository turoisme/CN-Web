const Movie = require('../models/Movie');
const Rating = require('../models/Rating');
const Review = require('../models/Review');
const Watchlist = require('../models/Watchlist');

/**
 * Get personalized movie recommendations for a user
 * @param {String} userId - User ID
 * @param {Number} limit - Number of recommendations
 * @returns {Array} - Recommended movies
 */
const getPersonalizedRecommendations = async (userId, limit = 10) => {
  try {
    // Get user's highly rated movies (score >= 7)
    const userRatings = await Rating.find({
      user: userId,
      score: { $gte: 7 }
    }).populate('movie');

    if (userRatings.length === 0) {
      // If no ratings, return trending movies
      return await getTrendingMovies(limit);
    }

    // Extract genres from user's favorite movies
    const favoriteGenres = [];
    userRatings.forEach(rating => {
      if (rating.movie && rating.movie.genres) {
        favoriteGenres.push(...rating.movie.genres);
      }
    });

    // Get unique genre IDs
    const uniqueGenreIds = [...new Set(favoriteGenres.map(g => g.toString()))];

    // Get movies already rated/watched by user
    const ratedMovieIds = userRatings.map(r => r.movie._id);
    const watchlistItems = await Watchlist.find({ user: userId });
    const watchlistMovieIds = watchlistItems.map(w => w.movie);
    const excludedMovieIds = [...ratedMovieIds, ...watchlistMovieIds];

    // Find similar movies
    const recommendations = await Movie.find({
      _id: { $nin: excludedMovieIds },
      genres: { $in: uniqueGenreIds },
      isActive: true,
      totalRatings: { $gte: 5 } // At least 5 ratings
    })
      .populate('genres', 'name')
      .populate('directors', 'name')
      .sort('-averageRating -totalRatings')
      .limit(limit);

    return recommendations;
  } catch (error) {
    throw new Error(`Personalized recommendations error: ${error.message}`);
  }
};

/**
 * Get similar movies based on genres and ratings
 * @param {String} movieId - Movie ID
 * @param {Number} limit - Number of similar movies
 * @returns {Array} - Similar movies
 */
const getSimilarMovies = async (movieId, limit = 10) => {
  try {
    const movie = await Movie.findById(movieId).populate('genres');

    if (!movie) {
      throw new Error('Movie not found');
    }

    const genreIds = movie.genres.map(g => g._id);

    // Find movies with similar genres
    const similarMovies = await Movie.find({
      _id: { $ne: movieId },
      genres: { $in: genreIds },
      isActive: true
    })
      .populate('genres', 'name')
      .populate('directors', 'name')
      .sort('-averageRating')
      .limit(limit);

    return similarMovies;
  } catch (error) {
    throw new Error(`Similar movies error: ${error.message}`);
  }
};

/**
 * Get trending movies based on recent views and ratings
 * @param {Number} limit - Number of movies
 * @returns {Array} - Trending movies
 */
const getTrendingMovies = async (limit = 10) => {
  try {
    // Get movies with high recent activity
    const movies = await Movie.find({ isActive: true })
      .populate('genres', 'name')
      .sort('-views -averageRating')
      .limit(limit);

    return movies;
  } catch (error) {
    throw new Error(`Trending movies error: ${error.message}`);
  }
};

/**
 * Get top rated movies of all time
 * @param {Number} limit - Number of movies
 * @param {Number} minRatings - Minimum number of ratings required
 * @returns {Array} - Top rated movies
 */
const getTopRatedMovies = async (limit = 10, minRatings = 10) => {
  try {
    const movies = await Movie.find({
      isActive: true,
      totalRatings: { $gte: minRatings }
    })
      .populate('genres', 'name')
      .populate('directors', 'name')
      .sort('-averageRating -totalRatings')
      .limit(limit);

    return movies;
  } catch (error) {
    throw new Error(`Top rated movies error: ${error.message}`);
  }
};

/**
 * Get movies by genre
 * @param {String} genreId - Genre ID
 * @param {Object} options - Options (limit, sort)
 * @returns {Array} - Movies in genre
 */
const getMoviesByGenre = async (genreId, options = {}) => {
  try {
    const { limit = 20, sort = '-averageRating' } = options;

    const movies = await Movie.find({
      genres: genreId,
      isActive: true
    })
      .populate('genres', 'name')
      .populate('directors', 'name')
      .sort(sort)
      .limit(limit);

    return movies;
  } catch (error) {
    throw new Error(`Movies by genre error: ${error.message}`);
  }
};

/**
 * Get recommended movies for homepage
 * @param {String} userId - User ID (optional)
 * @returns {Object} - Different categories of recommendations
 */
const getHomepageRecommendations = async (userId = null) => {
  try {
    const recommendations = {};

    // Trending movies
    recommendations.trending = await getTrendingMovies(10);

    // Top rated
    recommendations.topRated = await getTopRatedMovies(10);

    // If user is logged in, get personalized recommendations
    if (userId) {
      recommendations.forYou = await getPersonalizedRecommendations(userId, 10);
    }

    // Recently added
    recommendations.recentlyAdded = await Movie.find({ isActive: true })
      .populate('genres', 'name')
      .sort('-createdAt')
      .limit(10);

    return recommendations;
  } catch (error) {
    throw new Error(`Homepage recommendations error: ${error.message}`);
  }
};

/**
 * Get "Because you watched..." recommendations
 * @param {String} userId - User ID
 * @param {String} movieId - Movie ID that user watched
 * @param {Number} limit - Number of recommendations
 * @returns {Array} - Recommended movies
 */
const getBecauseYouWatchedRecommendations = async (userId, movieId, limit = 10) => {
  try {
    const movie = await Movie.findById(movieId).populate('genres directors');

    if (!movie) {
      throw new Error('Movie not found');
    }

    // Get user's watched/rated movies
    const userRatings = await Rating.find({ user: userId });
    const ratedMovieIds = userRatings.map(r => r.movie);

    // Find similar movies
    const genreIds = movie.genres.map(g => g._id);
    const directorIds = movie.directors.map(d => d._id);

    const recommendations = await Movie.find({
      _id: { $nin: [...ratedMovieIds, movieId] },
      $or: [
        { genres: { $in: genreIds } },
        { directors: { $in: directorIds } }
      ],
      isActive: true
    })
      .populate('genres', 'name')
      .populate('directors', 'name')
      .sort('-averageRating')
      .limit(limit);

    return recommendations;
  } catch (error) {
    throw new Error(`Because you watched recommendations error: ${error.message}`);
  }
};

module.exports = {
  getPersonalizedRecommendations,
  getSimilarMovies,
  getTrendingMovies,
  getTopRatedMovies,
  getMoviesByGenre,
  getHomepageRecommendations,
  getBecauseYouWatchedRecommendations
};