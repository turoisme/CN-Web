const List = require('../models/List');
const Watchlist = require('../models/Watchlist');
const Movie = require('../models/Movie');
const { HTTP_STATUS, MESSAGES } = require('../utils/constants');
const { validatePaginationParams } = require('../utils/validators');

// @desc    Create custom list
// @route   POST /api/lists
// @access  Private
exports.createList = async (req, res, next) => {
  try {
    const { title, description, movies, isPublic } = req.body;
    const userId = req.user._id;

    const list = await List.create({
      user: userId,
      title,
      description,
      movies: movies || [],
      isPublic: isPublic !== undefined ? isPublic : true
    });

    const populatedList = await List.findById(list._id)
      .populate('user', 'username avatar')
      .populate('movies', 'title posterUrl releaseYear averageRating');

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'List created successfully',
      data: { list: populatedList }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all public lists
// @route   GET /api/lists
// @access  Public
exports.getAllLists = async (req, res, next) => {
  try {
    const { page, limit } = validatePaginationParams(
      req.query.page,
      req.query.limit
    );

    const total = await List.countDocuments({ isPublic: true });

    const lists = await List.find({ isPublic: true })
      .populate('user', 'username avatar')
      .populate('movies', 'title posterUrl')
      .sort('-createdAt')
      .limit(limit)
      .skip((page - 1) * limit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        lists,
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

// @desc    Get list by ID
// @route   GET /api/lists/:id
// @access  Public
exports.getListById = async (req, res, next) => {
  try {
    const list = await List.findById(req.params.id)
      .populate('user', 'username avatar')
      .populate('movies', 'title posterUrl releaseYear averageRating genres directors');

    if (!list) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.LIST_NOT_FOUND
      });
    }

    // Check if list is private and user is not the owner
    if (!list.isPublic && (!req.user || list.user._id.toString() !== req.user._id.toString())) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'This list is private'
      });
    }

    // Increment views
    list.views += 1;
    await list.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { list }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's lists
// @route   GET /api/lists/user/:userId
// @access  Public
exports.getUserLists = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page, limit } = validatePaginationParams(
      req.query.page,
      req.query.limit
    );

    // Only show public lists unless it's the user's own lists
    const filter = { user: userId };
    if (!req.user || req.user._id.toString() !== userId) {
      filter.isPublic = true;
    }

    const total = await List.countDocuments(filter);

    const lists = await List.find(filter)
      .populate('movies', 'title posterUrl')
      .sort('-createdAt')
      .limit(limit)
      .skip((page - 1) * limit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        lists,
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

// @desc    Update list
// @route   PUT /api/lists/:id
// @access  Private
exports.updateList = async (req, res, next) => {
  try {
    const { title, description, movies, isPublic } = req.body;
    const listId = req.params.id;
    const userId = req.user._id;

    const list = await List.findById(listId);

    if (!list) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.LIST_NOT_FOUND
      });
    }

    // Check ownership
    if (list.user.toString() !== userId.toString()) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: MESSAGES.FORBIDDEN
      });
    }

    // Update list
    list.title = title || list.title;
    list.description = description || list.description;
    list.movies = movies || list.movies;
    list.isPublic = isPublic !== undefined ? isPublic : list.isPublic;

    await list.save();

    const populatedList = await List.findById(list._id)
      .populate('movies', 'title posterUrl releaseYear averageRating');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.UPDATED,
      data: { list: populatedList }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete list
// @route   DELETE /api/lists/:id
// @access  Private
exports.deleteList = async (req, res, next) => {
  try {
    const listId = req.params.id;
    const userId = req.user._id;

    const list = await List.findById(listId);

    if (!list) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.LIST_NOT_FOUND
      });
    }

    // Check ownership
    if (list.user.toString() !== userId.toString()) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: MESSAGES.FORBIDDEN
      });
    }

    await list.deleteOne();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.DELETED
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add movie to watchlist
// @route   POST /api/lists/watchlist/:movieId
// @access  Private
exports.addToWatchlist = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const userId = req.user._id;

    // Check if movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.MOVIE_NOT_FOUND
      });
    }

    // Check if already in watchlist
    const existing = await Watchlist.findOne({ user: userId, movie: movieId });
    if (existing) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: MESSAGES.ALREADY_IN_WATCHLIST
      });
    }

    const watchlistItem = await Watchlist.create({
      user: userId,
      movie: movieId
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Added to watchlist',
      data: { watchlistItem }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove movie from watchlist
// @route   DELETE /api/lists/watchlist/:movieId
// @access  Private
exports.removeFromWatchlist = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const userId = req.user._id;

    const watchlistItem = await Watchlist.findOneAndDelete({
      user: userId,
      movie: movieId
    });

    if (!watchlistItem) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.NOT_IN_WATCHLIST
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Removed from watchlist'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's watchlist
// @route   GET /api/lists/watchlist
// @access  Private
exports.getWatchlist = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page, limit } = validatePaginationParams(
      req.query.page,
      req.query.limit
    );

    const total = await Watchlist.countDocuments({ user: userId });

    const watchlist = await Watchlist.find({ user: userId })
      .populate('movie', 'title posterUrl releaseYear averageRating genres')
      .sort('-addedAt')
      .limit(limit)
      .skip((page - 1) * limit);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        watchlist,
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

// @desc    Get similar movies
// @route   GET /api/lists/similar/:movieId
// @access  Public
exports.getSimilarMovies = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const { limit = 10 } = req.query;

    const movie = await Movie.findById(movieId).populate('genres');

    if (!movie) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.MOVIE_NOT_FOUND
      });
    }

    // Find movies with similar genres
    const genreIds = movie.genres.map(g => g._id);

    const similarMovies = await Movie.find({
      _id: { $ne: movieId },
      genres: { $in: genreIds },
      isActive: true
    })
      .populate('genres', 'name')
      .sort('-averageRating')
      .limit(parseInt(limit));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { similarMovies }
    });
  } catch (error) {
    next(error);
  }
};