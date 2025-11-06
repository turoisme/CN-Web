const Movie = require('../models/Movie');
const { HTTP_STATUS, MESSAGES, PAGINATION } = require('../utils/constants');
const { validatePaginationParams } = require('../utils/validators');

// @desc    Get all movies with pagination and filters
// @route   GET /api/movies
// @access  Public
exports.getAllMovies = async (req, res, next) => {
  try {
    const { page, limit } = validatePaginationParams(
      req.query.page,
      req.query.limit
    );
    
    const { sort = '-createdAt', genre, year, minRating } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (genre) {
      filter.genres = genre;
    }
    
    if (year) {
      filter.releaseYear = parseInt(year);
    }
    
    if (minRating) {
      filter.averageRating = { $gte: parseFloat(minRating) };
    }

    // Get total count for pagination
    const total = await Movie.countDocuments(filter);

    // Get movies
    const movies = await Movie.find(filter)
      .populate('genres', 'name slug')
      .populate('directors', 'name')
      .populate('actors', 'name')
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-__v');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        movies,
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

// @desc    Get single movie by ID
// @route   GET /api/movies/:id
// @access  Public
exports.getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id)
      .populate('genres', 'name slug')
      .populate('directors', 'name photoUrl')
      .populate('actors', 'name photoUrl')
      .populate('createdBy', 'username');

    if (!movie) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.MOVIE_NOT_FOUND
      });
    }

    // Increment view count
    movie.views += 1;
    await movie.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { movie }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search movies
// @route   GET /api/movies/search
// @access  Public
exports.searchMovies = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const validParams = validatePaginationParams(page, limit);

    // Text search
    const movies = await Movie.find({
      $text: { $search: q },
      isActive: true
    })
      .populate('genres', 'name')
      .populate('directors', 'name')
      .sort({ score: { $meta: 'textScore' } })
      .limit(validParams.limit)
      .skip((validParams.page - 1) * validParams.limit);

    const total = await Movie.countDocuments({
      $text: { $search: q },
      isActive: true
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        movies,
        pagination: {
          page: validParams.page,
          limit: validParams.limit,
          total,
          pages: Math.ceil(total / validParams.limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Filter movies with advanced options
// @route   GET /api/movies/filter
// @access  Public
exports.filterMovies = async (req, res, next) => {
  try {
    const {
      genres,
      minYear,
      maxYear,
      minRating,
      maxRating,
      country,
      sort = '-averageRating',
      page = 1,
      limit = 20
    } = req.query;

    const validParams = validatePaginationParams(page, limit);

    // Build filter
    const filter = { isActive: true };

    if (genres) {
      const genreArray = genres.split(',');
      filter.genres = { $in: genreArray };
    }

    if (minYear || maxYear) {
      filter.releaseYear = {};
      if (minYear) filter.releaseYear.$gte = parseInt(minYear);
      if (maxYear) filter.releaseYear.$lte = parseInt(maxYear);
    }

    if (minRating || maxRating) {
      filter.averageRating = {};
      if (minRating) filter.averageRating.$gte = parseFloat(minRating);
      if (maxRating) filter.averageRating.$lte = parseFloat(maxRating);
    }

    if (country) {
      filter.country = new RegExp(country, 'i');
    }

    const total = await Movie.countDocuments(filter);

    const movies = await Movie.find(filter)
      .populate('genres', 'name')
      .populate('directors', 'name')
      .sort(sort)
      .limit(validParams.limit)
      .skip((validParams.page - 1) * validParams.limit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        movies,
        filters: { genres, minYear, maxYear, minRating, maxRating, country },
        pagination: {
          page: validParams.page,
          limit: validParams.limit,
          total,
          pages: Math.ceil(total / validParams.limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending movies
// @route   GET /api/movies/trending
// @access  Public
exports.getTrendingMovies = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const movies = await Movie.find({ isActive: true })
      .populate('genres', 'name')
      .sort('-views -averageRating')
      .limit(parseInt(limit));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { movies }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top rated movies
// @route   GET /api/movies/top-rated
// @access  Public
exports.getTopRatedMovies = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const movies = await Movie.find({ 
      isActive: true,
      totalRatings: { $gte: 10 } // At least 10 ratings
    })
      .populate('genres', 'name')
      .sort('-averageRating')
      .limit(parseInt(limit));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { movies }
    });
  } catch (error) {
    next(error);
  }
};