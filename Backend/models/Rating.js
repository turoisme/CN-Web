const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
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
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: [1, 'Score must be at least 1'],
    max: [10, 'Score cannot exceed 10']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index: One rating per user per movie
ratingSchema.index({ user: 1, movie: 1 }, { unique: true });

// Index for calculating average
ratingSchema.index({ movie: 1, score: 1 });

module.exports = mongoose.model('Rating', ratingSchema);