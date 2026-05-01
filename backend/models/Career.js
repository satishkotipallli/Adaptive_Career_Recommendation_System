const mongoose = require('mongoose');

const CareerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  domain: String,
  required_skills: [String],
  average_salary: Number,
  growth_rate: String
});

module.exports = mongoose.model('Career', CareerSchema);
