const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  selected_careers: {
    type: [String],
    default: []
  },
  liked_careers: {
    type: [String],
    default: []
  },
  disliked_careers: {
    type: [String],
    default: []
  },
  completed_modules: [
    {
      career: String,
      module: String,
      completedAt: { type: Date, default: Date.now }
    }
  ],
  feedback_scores: [
    {
      career: String,
      module: { type: String, default: null },
      action: { type: String, enum: ['like', 'dislike', 'rating', 'module_rating'] },
      rating: Number,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  progress: [
    {
      career: String,
      moduleTitle: String,
      completedAt: { type: Date, default: Date.now }
    }
  ],
  activeCareer: {
    title: String,
    modules: [
      {
        title: String,
        theory: String,
        youtube_query: String,
        questions: [String]
      }
    ],
    startedAt: { type: Date, default: Date.now }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
