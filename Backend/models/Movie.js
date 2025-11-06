const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Movie title is required'],
    trim: true
  },
  originalTitle: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  releaseYear: {
    type: Number,
    required: [true, 'Release year is required'],
    min: [1800, 'Release year must be after 1800'],
    max: [new Date().getFullYear() + 5, 'Release year is too far in the future']
  },
  duration: {
    type: Number, // Duration in minutes
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be positive']
  },
  country: {
    type: String,
    required: [true, 'Country is required']
  },
  language: {
    type: String,
    default: 'English'
  },
  posterUrl: {
    type: String,
    required: [true, 'Poster URL is required']
  },
  trailerUrl: {
    type: String,
    default: null
  },
  genres: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Genre'
  }],
  directors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Director'
  }],
  actors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Actor'
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better search performance
movieSchema.index({ title: 'text', description: 'text' });
movieSchema.index({ releaseYear: 1 });
movieSchema.index({ averageRating: -1 });

module.exports = mongoose.model('Movie', movieSchema);