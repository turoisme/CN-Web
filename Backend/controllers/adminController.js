const User = require('../models/User');
const Movie = require('../models/Movie');
const Review = require('../models/Review');
const { HTTP_STATUS, MESSAGES } = require('../utils/constants');
const { validatePaginationParams } = require('../utils/validators');

// ========== USER MANAGEMENT (UC014) ==========

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page, limit } = validatePaginationParams(
      req.query.page,
      req.query.limit
    );
    const { search, role, isActive } = req.query;

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { username: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const total = await User.countDocuments(filter);

    const users = await User.find(filter)
      .select('-password')
      .sort('-createdAt')
      .limit(limit)
      .skip((page - 1) * limit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.USER_NOT_FOUND
      });
    }

    // Get user statistics
    const Review = require('../models/Review');
    const Rating = require('../models/Rating');
    const List = require('../models/List');

    const stats = {
      totalReviews: await Review.countDocuments({ user: user._id }),
      totalRatings: await Rating.countDocuments({ user: user._id }),
      totalLists: await List.countDocuments({ user: user._id })
    };

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { user, stats }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.USER_NOT_FOUND
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User role updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate/Deactivate user
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.USER_NOT_FOUND
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.USER_NOT_FOUND
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    await user.deleteOne();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.DELETED
    });
  } catch (error) {
    next(error);
  }
};

// ========== MOVIE MANAGEMENT (UC015) ==========

// @desc    Create movie
// @route   POST /api/admin/movies
// @access  Private/Admin
exports.createMovie = async (req, res, next) => {
  try {
    const movieData = {
      ...req.body,
      createdBy: req.user._id
    };

    const movie = await Movie.create(movieData);

    const populatedMovie = await Movie.findById(movie._id)
      .populate('genres', 'name')
      .populate('directors', 'name')
      .populate('actors', 'name');

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Movie created successfully',
      data: { movie: populatedMovie }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update movie
// @route   PUT /api/admin/movies/:id
// @access  Private/Admin
exports.updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('genres', 'name')
      .populate('directors', 'name')
      .populate('actors', 'name');

    if (!movie) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.MOVIE_NOT_FOUND
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.UPDATED,
      data: { movie }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete movie
// @route   DELETE /api/admin/movies/:id
// @access  Private/Admin
exports.deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.MOVIE_NOT_FOUND
      });
    }

    await movie.deleteOne();

    // Optional: Delete associated reviews and ratings
    await Review.deleteMany({ movie: req.params.id });
    await require('../models/Rating').deleteMany({ movie: req.params.id });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.DELETED
    });
  } catch (error) {
    next(error);
  }
};

// ========== REVIEW MODERATION (UC016) ==========

// @desc    Get all reviews (with filters)
// @route   GET /api/admin/reviews
// @access  Private/Admin
exports.getAllReviews = async (req, res, next) => {
  try {
    const { page, limit } = validatePaginationParams(
      req.query.page,
      req.query.limit
    );
    const { isHidden, movieId, userId } = req.query;

    // Build filter
    const filter = {};
    if (isHidden !== undefined) filter.isHidden = isHidden === 'true';
    if (movieId) filter.movie = movieId;
    if (userId) filter.user = userId;

    const total = await Review.countDocuments(filter);

    const reviews = await Review.find(filter)
      .populate('user', 'username email')
      .populate('movie', 'title')
      .sort('-createdAt')
      .limit(limit)
      .skip((page - 1) * limit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Hide/Unhide review
// @route   PUT /api/admin/reviews/:id/visibility
// @access  Private/Admin
exports.toggleReviewVisibility = async (req, res, next) => {
  try {
    const { isHidden } = req.body;

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isHidden },
      { new: true }
    );

    if (!review) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.REVIEW_NOT_FOUND
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Review ${isHidden ? 'hidden' : 'unhidden'} successfully`,
      data: { review }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/admin/reviews/:id
// @access  Private/Admin
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.REVIEW_NOT_FOUND
      });
    }

    await review.deleteOne();

    // Recalculate movie rating
    const recalculateMovieRating = require('./reviewController').recalculateMovieRating;
    if (recalculateMovieRating) {
      await recalculateMovieRating(review.movie);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.DELETED
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMovies = await Movie.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalRatings = await require('../models/Rating').countDocuments();

    const recentUsers = await User.find()
      .select('username email createdAt')
      .sort('-createdAt')
      .limit(5);

    const recentReviews = await Review.find()
      .populate('user', 'username')
      .populate('movie', 'title')
      .sort('-createdAt')
      .limit(5);

    const topRatedMovies = await Movie.find({ totalRatings: { $gte: 5 } })
      .sort('-averageRating')
      .limit(10)
      .select('title averageRating totalRatings');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalMovies,
          totalReviews,
          totalRatings
        },
        recentUsers,
        recentReviews,
        topRatedMovies
      }
    });
  } catch (error) {
    next(error);
  }
};