const mongoose = require('mongoose');

const SkillGapHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    career: {
      type: String,
      required: true
    },
    userSkills: {
      type: [String],
      required: true
    },
    matchedSkills: {
      type: [String],
      default: []
    },
    missingSkills: {
      type: [
        {
          skill: String,
          priority: Number,
          level: String
        }
      ],
      default: []
    },
    matchPercentage: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    status: {
      type: String,
      enum: ['ready', 'intermediate', 'beginner_advanced', 'beginner'],
      required: true
    },
    learningPath: {
      phase: String,
      focus: String,
      recommendation: String,
      skillsToLearn: [String],
      timeline: String
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
SkillGapHistorySchema.index({ user: 1, createdAt: -1 });
SkillGapHistorySchema.index({ career: 1 });
SkillGapHistorySchema.index({ user: 1, career: 1 });

// Method to get latest analysis for a career
SkillGapHistorySchema.statics.findLatestAnalysis = async function (userId, career) {
  return await this.findOne({ user: userId, career })
    .sort({ createdAt: -1 })
    .exec();
};

// Method to get progress over time
SkillGapHistorySchema.statics.findProgressHistory = async function (userId, career) {
  return await this.find({ user: userId, career })
    .sort({ createdAt: -1 })
    .limit(10)
    .exec();
};

// Method to calculate improvement
SkillGapHistorySchema.statics.calculateImprovement = async function (userId, career) {
  const analyses = await this.find({ user: userId, career })
    .sort({ createdAt: 1 })
    .exec();

  if (analyses.length < 2) {
    return null;
  }

  const first = analyses[0];
  const latest = analyses[analyses.length - 1];

  return {
    initialMatch: first.matchPercentage,
    currentMatch: latest.matchPercentage,
    improvement: latest.matchPercentage - first.matchPercentage,
    skillsGained: latest.matchedSkills.length - first.matchedSkills.length,
    careerPath: career,
    period: {
      from: first.createdAt,
      to: latest.createdAt
    }
  };
};

module.exports = mongoose.model('SkillGapHistory', SkillGapHistorySchema);
