const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: [true, 'Movie is required']
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index: One entry per user per movie
watchlistSchema.index({ user: 1, movie: 1 }, { unique: true });

// Index for user's watchlist
watchlistSchema.index({ user: 1, addedAt: -1 });

module.exports = mongoose.model('Watchlist', watchlistSchema);