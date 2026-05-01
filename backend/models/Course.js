const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  platform: String,
  url: String,
  skills_covered: [String],
  rating: Number,
  provider: String
});

module.exports = mongoose.model('Course', CourseSchema);
