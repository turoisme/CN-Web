const mongoose = require('mongoose');

const directorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Director name is required'],
    trim: true
  },
  birthDate: {
    type: Date,
    default: null
  },
  nationality: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [2000, 'Bio cannot exceed 2000 characters']
  },
  photoUrl: {
    type: String,
    default: null
  },
  movieCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for name search
directorSchema.index({ name: 'text' });

module.exports = mongoose.model('Director', directorSchema);