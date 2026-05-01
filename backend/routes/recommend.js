const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const Profile = require('../models/Profile');
const Recommendation = require('../models/Recommendation');
const User = require('../models/User');

// @route   POST api/recommend/career
// @desc    Get career recommendations based on skills
// @access  Private
router.post('/career', auth, async (req, res) => {
  const { skills } = req.body;

  if (!skills || (Array.isArray(skills) && skills.length === 0)) {
    return res.status(400).json({ msg: 'Please provide skills' });
  }

  try {
    const rawText = Array.isArray(skills) ? skills.join(', ') : String(skills);
    const currentSkills = Array.isArray(skills)
      ? skills.map((skill) => String(skill).trim().toLowerCase()).filter(Boolean)
      : rawText.toLowerCase().split(/[^a-z0-9]+/).map((skill) => skill.trim()).filter(Boolean);

    const user = await User.findById(req.user.id);
    const likedCareers = new Set((user?.liked_careers || []).map((c) => c.toLowerCase()));
    const dislikedCareers = new Set((user?.disliked_careers || []).map((c) => c.toLowerCase()));
    const feedbackRecords = user?.feedback_scores || [];

    const profiles = await Profile.find({}, 'user skills').lean();
    const recommendationLogs = await Recommendation.find({}, 'user recommended_careers').lean();
    const logsByUser = new Map(recommendationLogs.map((log) => [String(log.user), log.recommended_careers || []]));

    const recommendationHistory = profiles
      .map((profile) => {
        const profileSkills = (profile.skills || []).map((skill) => String(skill).trim().toLowerCase()).filter(Boolean);
        const overlap = profileSkills.filter((skill) => currentSkills.includes(skill)).length;
        const union = new Set([...profileSkills, ...currentSkills]).size || 1;
        const similarity = overlap / union;

        return {
          user: String(profile.user),
          similarity,
          skills: profileSkills,
          careers: logsByUser.get(String(profile.user)) || []
        };
      })
      .filter((entry) => entry.similarity > 0 && entry.careers.length > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 20)
      .map(({ skills, careers }) => ({ skills, careers }));

    // Call Python ML Service
    const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/recommend`, {
      skills: Array.isArray(skills) ? skills : [rawText],
      raw_text: rawText,
      recommendation_history: recommendationHistory,
      liked_careers: user?.liked_careers || [],
      disliked_careers: user?.disliked_careers || []
    });

    let recommendations = (mlResponse.data.career_recommendations || []).slice(0, 10);

    // Recommendations personalization rules if liked roles exist
    const similarCareerMap = {
      'backend developer': ['API Developer', 'Node.js Developer', 'Full Stack Developer'],
      'api developer': ['Backend Developer', 'Node.js Developer', 'Full Stack Developer'],
      'frontend developer': ['React Developer', 'UI Developer', 'Full Stack Developer']
    };

    if (likedCareers.size > 0) {
      for (const likedCareer of likedCareers) {
        const relatives = similarCareerMap[likedCareer.toLowerCase()];
        if (Array.isArray(relatives)) {
          relatives.forEach((jobRole) => {
            if (!recommendations.some((r) => r.job_role.toLowerCase() === jobRole.toLowerCase())) {
              recommendations.push({ job_role: jobRole, domain: 'Personalized', score: 0.4 });
            }
          });
        }
      }
    }

    const normalizedRecommendations = recommendations
      .map((rec) => {
        const careerKey = (rec.job_role || rec.career || '').toLowerCase();
        const baseScore = Number(rec.score) || 0;
        const userPreference = likedCareers.has(careerKey) ? 1 : dislikedCareers.has(careerKey) ? -1 : 0;

        const feedbackForCareer = feedbackRecords
          .filter((f) => f.career && f.career.toLowerCase() === careerKey && f.rating)
          .map((f) => Number(f.rating));

        const feedbackScore = feedbackForCareer.length > 0 ? feedbackForCareer.reduce((a, b) => a + b, 0) / feedbackForCareer.length / 5 : 0;

        const finalScore = Math.min(
          1,
          Math.max(0, 0.6 * baseScore + 0.2 * ((userPreference + 1) / 2) + 0.2 * feedbackScore)
        );

        return {
          career: rec.job_role || rec.career,
          job_role: rec.job_role || rec.career,
          domain: rec.domain || 'General',
          score: baseScore,
          match_percentage: Number((finalScore * 100).toFixed(2)),
          user_preference: userPreference,
          feedback_score: Number((feedbackScore * 100).toFixed(0))
        };
      })
      .sort((a, b) => b.match_percentage - a.match_percentage)
      .slice(0, 12);

    const dislikedAll = normalizedRecommendations.length > 0 && normalizedRecommendations.every((rec) => dislikedCareers.has(rec.career.toLowerCase()));

    const newRecommendation = new Recommendation({
      user: req.user.id,
      recommended_careers: normalizedRecommendations.map((rec) => ({
        careerTitle: rec.career,
        score: rec.score
      }))
    });
    await newRecommendation.save();

    return res.json({
      recommendations: normalizedRecommendations,
      isNewUser: !user || (!user.liked_careers?.length && !user.disliked_careers?.length),
      dislikedAll,
      message: dislikedAll ? 'All career recommendations are disliked. Please add new skills for better results.' : undefined
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Error fetching recommendations from ML Service' });
  }
});

// @route   POST api/recommend/feedback
// @desc    Save like/dislike/rating feedback for career recommendations
// @access  Private
router.post('/feedback', auth, async (req, res) => {
  const { career, action, rating } = req.body;

  if (!career || !action || !['like', 'dislike'].includes(action)) {
    return res.status(400).json({ msg: 'career and action [like|dislike] are required' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const careerNormalized = career.trim();

    if (!user.selected_careers.includes(careerNormalized)) {
      user.selected_careers.push(careerNormalized);
    }

    if (action === 'like') {
      if (!user.liked_careers.includes(careerNormalized)) user.liked_careers.push(careerNormalized);
      user.disliked_careers = user.disliked_careers.filter((c) => c.toLowerCase() !== careerNormalized.toLowerCase());
    } else {
      if (!user.disliked_careers.includes(careerNormalized)) user.disliked_careers.push(careerNormalized);
      user.liked_careers = user.liked_careers.filter((c) => c.toLowerCase() !== careerNormalized.toLowerCase());
    }

    user.feedback_scores.push({ career: careerNormalized, module: null, action, rating: rating || null });
    await user.save();

    return res.json({ msg: 'Career feedback saved', liked_careers: user.liked_careers, disliked_careers: user.disliked_careers });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Error saving feedback' });
  }
});

// @route   POST api/recommend/module-feedback
// @desc    Save module completion + rating
// @access  Private
router.post('/module-feedback', auth, async (req, res) => {
  const { career, module, completed, rating } = req.body;

  if (!career || !module) {
    return res.status(400).json({ msg: 'career and module are required' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const careerNormalized = career.trim();
    const moduleNormalized = module.trim();

    if (completed) {
      const already = user.completed_modules.some((entry) => entry.career === careerNormalized && entry.module === moduleNormalized);
      if (!already) {
        user.completed_modules.push({ career: careerNormalized, module: moduleNormalized });
      }
    }

    if (rating) {
      user.feedback_scores.push({ career: careerNormalized, module: moduleNormalized, action: 'module_rating', rating });
    }

    await user.save();

    return res.json({ msg: 'Module feedback saved', completed_modules: user.completed_modules });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Error saving module feedback' });
  }
});

// @route   POST api/recommend/details
// @desc    Get detailed career modules (Proxy to ML Service)
// @access  Private
router.post('/details', auth, async (req, res) => {
  const { career, skills = [] } = req.body;
  try {
    const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/career_details`, {
      career,
      user_skills: skills
    });
    res.json(mlResponse.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error fetching career details' });
  }
});

// @route   POST api/recommend/skill-gap
// @desc    Analyze skill gap for a career
// @access  Private
router.post('/skill-gap', auth, async (req, res) => {
  const { skills, career } = req.body;

  if (!skills || (Array.isArray(skills) && skills.length === 0)) {
    return res.status(400).json({ msg: 'Please provide skills' });
  }

  if (!career) {
    return res.status(400).json({ msg: 'Please provide a career' });
  }

  try {
    // Normalize skills
    const normalizedSkills = Array.isArray(skills)
      ? skills.map((skill) => String(skill).trim().toLowerCase()).filter(Boolean)
      : String(skills)
          .toLowerCase()
          .split(/[,;]/)
          .map((skill) => skill.trim())
          .filter(Boolean);

    // Call ML Service
    const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/skill-gap`, {
      skills: normalizedSkills,
      career: career.trim()
    });

    if (mlResponse.data.error) {
      return res.status(400).json({
        msg: mlResponse.data.error,
        career: career,
        matched_skills: [],
        missing_skills: [],
        match_percentage: 0
      });
    }

    // Enhance response with recommendations for learning
    const enhancedResponse = {
      ...mlResponse.data,
      recommendations: mlResponse.data.learning_path || null,
      next_steps:
        mlResponse.data.status === 'ready'
          ? 'You are ready for this role! Start applying to positions.'
          : `Focus on learning: ${
              mlResponse.data.missing_skills && mlResponse.data.missing_skills.length > 0
                ? mlResponse.data.missing_skills.slice(0, 3)
                    .map((s) => (typeof s === 'string' ? s : s.skill))
                    .join(', ')
                : 'the missing skills'
            }`
    };

    res.json(enhancedResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error analyzing skill gap', error: err.message });
  }
});

module.exports = router;
