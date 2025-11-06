const mongoose = require('mongoose');

const reviewVoteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    required: [true, 'Review is required']
  },
  voteType: {
    type: String,
    enum: ['helpful', 'unhelpful'],
    required: [true, 'Vote type is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index: One vote per user per review
reviewVoteSchema.index({ user: 1, review: 1 }, { unique: true });

module.exports = mongoose.model('ReviewVote', reviewVoteSchema);