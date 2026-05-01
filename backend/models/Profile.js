const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  skills: {
    type: [String],
    default: []
  },
  interests: {
    type: [String],
    default: []
  },
  education: {
    degree: String,
    institution: String,
    year: Number
  },
  experience_level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Expert'],
    default: 'Beginner'
  },
  preferred_domains: {
    type: [String],
    default: []
  }
});

module.exports = mongoose.model('Profile', ProfileSchema);
