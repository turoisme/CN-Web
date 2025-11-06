const Rating = require('../models/Rating');
const Movie = require('../models/Movie');
const Review = require('../models/Review');

/**
 * Calculate and update average rating for a movie
 * @param {String} movieId - Movie ID
 * @returns {Object} - Updated rating stats
 */
const calculateAverageRating = async (movieId) => {
  try {
    // Get all ratings for the movie
    const ratings = await Rating.find({ movie: movieId });

    if (ratings.length === 0) {
      await Movie.findByIdAndUpdate(movieId, {
        averageRating: 0,
        totalRatings: 0
      });
      return { averageRating: 0, totalRatings: 0 };
    }

    // Calculate average
    const sum = ratings.reduce((acc, rating) => acc + rating.score, 0);
    const average = sum / ratings.length;
    const roundedAverage = Math.round(average * 10) / 10; // Round to 1 decimal

    // Update movie
    await Movie.findByIdAndUpdate(movieId, {
      averageRating: roundedAverage,
      totalRatings: ratings.length,
      totalReviews: await Review.countDocuments({ movie: movieId })
    });

    return {
      averageRating: roundedAverage,
      totalRatings: ratings.length
    };
  } catch (error) {
    throw new Error(`Error calculating average rating: ${error.message}`);
  }
};

/**
 * Get rating distribution for a movie
 * @param {String} movieId - Movie ID
 * @returns {Object} - Rating distribution
 */
const getRatingDistribution = async (movieId) => {
  try {
    const distribution = await Rating.aggregate([
      { $match: { movie: movieId } },
      {
        $group: {
          _id: '$score',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Format distribution
    const formatted = {};
    for (let i = 1; i <= 10; i++) {
      formatted[i] = 0;
    }

    distribution.forEach(item => {
      formatted[item._id] = item.count;
    });

    return formatted;
  } catch (error) {
    throw new Error(`Error getting rating distribution: ${error.message}`);
  }
};

/**
 * Get user's rating for a movie
 * @param {String} userId - User ID
 * @param {String} movieId - Movie ID
 * @returns {Object|null} - User's rating or null
 */
const getUserRating = async (userId, movieId) => {
  try {
    return await Rating.findOne({ user: userId, movie: movieId });
  } catch (error) {
    throw new Error(`Error getting user rating: ${error.message}`);
  }
};

/**
 * Get all user's ratings with movie details
 * @param {String} userId - User ID
 * @param {Object} options - Pagination options
 * @returns {Object} - Ratings with pagination
 */
const getUserRatings = async (userId, options = {}) => {
  try {
    const { page = 1, limit = 20, sort = '-createdAt' } = options;

    const total = await Rating.countDocuments({ user: userId });

    const ratings = await Rating.find({ user: userId })
      .populate('movie', 'title posterUrl releaseYear genres')
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit);

    return {
      ratings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new Error(`Error getting user ratings: ${error.message}`);
  }
};

/**
 * Get rating statistics for a movie
 * @param {String} movieId - Movie ID
 * @returns {Object} - Rating statistics
 */
const getRatingStats = async (movieId) => {
  try {
    const movie = await Movie.findById(movieId);
    
    if (!movie) {
      throw new Error('Movie not found');
    }

    const distribution = await getRatingDistribution(movieId);

    return {
      averageRating: movie.averageRating,
      totalRatings: movie.totalRatings,
      distribution
    };
  } catch (error) {
    throw new Error(`Error getting rating stats: ${error.message}`);
  }
};

module.exports = {
  calculateAverageRating,
  getRatingDistribution,
  getUserRating,
  getUserRatings,
  getRatingStats
};