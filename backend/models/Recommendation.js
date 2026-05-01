const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recommended_careers: [{
    careerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Career'
    },
    careerTitle: String, // Storing title for easier access if Career is deleted/modified
    score: Number
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Recommendation', RecommendationSchema);
