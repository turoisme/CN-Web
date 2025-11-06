const Review = require('../models/Review');
const Rating = require('../models/Rating');
const ReviewVote = require('../models/ReviewVote');
const Movie = require('../models/Movie');
const { HTTP_STATUS, MESSAGES } = require('../utils/constants');
const { validatePaginationParams } = require('../utils/validators');

// @desc    Create or update rating
// @route   POST /api/reviews/rating
// @access  Private
exports.createRating = async (req, res, next) => {
  try {
    const { movieId, score } = req.body;
    const userId = req.user._id;

    // Check if movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.MOVIE_NOT_FOUND
      });
    }

    // Check if user already rated this movie
    let rating = await Rating.findOne({ user: userId, movie: movieId });

    if (rating) {
      // Update existing rating
      rating.score = score;
      await rating.save();
    } else {
      // Create new rating
      rating = await Rating.create({
        user: userId,
        movie: movieId,
        score
      });
    }

    // Recalculate movie average rating
    await recalculateMovieRating(movieId);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Rating submitted successfully',
      data: { rating }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const { movieId, rating, content } = req.body;
    const userId = req.user._id;

    // Check if movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.MOVIE_NOT_FOUND
      });
    }

    // Check if user already reviewed this movie
    const existingReview = await Review.findOne({ user: userId, movie: movieId });
    if (existingReview) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: MESSAGES.REVIEW_ALREADY_EXISTS
      });
    }

    // Create review
    const review = await Review.create({
      user: userId,
      movie: movieId,
      rating,
      content
    });

    // Also create/update rating
    await Rating.findOneAndUpdate(
      { user: userId, movie: movieId },
      { score: rating },
      { upsert: true }
    );

    // Update movie stats
    await recalculateMovieRating(movieId);

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'username avatar');

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Review created successfully',
      data: { review: populatedReview }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a movie
// @route   GET /api/reviews/movie/:movieId
// @access  Public
exports.getMovieReviews = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const { page, limit } = validatePaginationParams(
      req.query.page,
      req.query.limit
    );
    const { sort = '-helpfulVotes' } = req.query;

    const total = await Review.countDocuments({ 
      movie: movieId, 
      isHidden: false 
    });

    const reviews = await Review.find({ 
      movie: movieId, 
      isHidden: false 
    })
      .populate('user', 'username avatar')
      .sort(sort)
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

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res, next) => {
  try {
    const { rating, content } = req.body;
    const reviewId = req.params.id;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.REVIEW_NOT_FOUND
      });
    }

    // Check ownership
    if (review.user.toString() !== userId.toString()) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: MESSAGES.FORBIDDEN
      });
    }

    // Update review
    review.rating = rating;
    review.content = content;
    review.isEdited = true;
    review.editedAt = Date.now();
    await review.save();

    // Update rating
    await Rating.findOneAndUpdate(
      { user: userId, movie: review.movie },
      { score: rating }
    );

    // Recalculate movie rating
    await recalculateMovieRating(review.movie);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.UPDATED,
      data: { review }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.REVIEW_NOT_FOUND
      });
    }

    // Check ownership or admin
    if (review.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: MESSAGES.FORBIDDEN
      });
    }

    await review.deleteOne();

    // Recalculate movie rating
    await recalculateMovieRating(review.movie);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.DELETED
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Vote on review (helpful/unhelpful)
// @route   POST /api/reviews/:id/vote
// @access  Private
exports.voteReview = async (req, res, next) => {
  try {
    const { voteType } = req.body; // 'helpful' or 'unhelpful'
    const reviewId = req.params.id;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.REVIEW_NOT_FOUND
      });
    }

    // Check if user already voted
    const existingVote = await ReviewVote.findOne({ 
      user: userId, 
      review: reviewId 
    });

    if (existingVote) {
      // Update vote if different
      if (existingVote.voteType !== voteType) {
        // Remove old vote count
        if (existingVote.voteType === 'helpful') {
          review.helpfulVotes -= 1;
        } else {
          review.unhelpfulVotes -= 1;
        }

        // Add new vote count
        if (voteType === 'helpful') {
          review.helpfulVotes += 1;
        } else {
          review.unhelpfulVotes += 1;
        }

        existingVote.voteType = voteType;
        await existingVote.save();
      }
    } else {
      // Create new vote
      await ReviewVote.create({
        user: userId,
        review: reviewId,
        voteType
      });

      // Update vote count
      if (voteType === 'helpful') {
        review.helpfulVotes += 1;
      } else {
        review.unhelpfulVotes += 1;
      }
    }

    await review.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        helpfulVotes: review.helpfulVotes,
        unhelpfulVotes: review.unhelpfulVotes
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to recalculate movie rating
const recalculateMovieRating = async (movieId) => {
  const ratings = await Rating.find({ movie: movieId });
  
  if (ratings.length === 0) {
    await Movie.findByIdAndUpdate(movieId, {
      averageRating: 0,
      totalRatings: 0,
      totalReviews: await Review.countDocuments({ movie: movieId })
    });
    return;
  }

  const sum = ratings.reduce((acc, rating) => acc + rating.score, 0);
  const average = sum / ratings.length;

  await Movie.findByIdAndUpdate(movieId, {
    averageRating: Math.round(average * 10) / 10,
    totalRatings: ratings.length,
    totalReviews: await Review.countDocuments({ movie: movieId })
  });
};