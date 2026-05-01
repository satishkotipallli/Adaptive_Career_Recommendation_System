const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Recommendation = require('../models/Recommendation');
const User = require('../models/User');

// @route   GET api/admin/analytics
// @desc    Get recommendation logs for admin
// @access  Private (Admin only)
router.get('/analytics', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }

        const recommendations = await Recommendation.find()
            .populate('user', ['name', 'email'])
            .sort({ timestamp: -1 })
            .limit(50); // Get last 50 logs

        // Fetch users with their progress
        const usersWithProgress = await User.find({ role: 'student' }).select('name email progress');

        const totalUsers = await User.countDocuments({ role: 'student' });
        const totalRecommendations = await Recommendation.countDocuments();

        // Calculate most popular careers
        const careerCounts = {};
        const allRecs = await Recommendation.find();
        allRecs.forEach(rec => {
            rec.recommended_careers.forEach(career => {
                const title = career.careerTitle;
                careerCounts[title] = (careerCounts[title] || 0) + 1;
            });
        });

        const popularCareers = Object.entries(careerCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([title, count]) => ({ title, count }));

        res.json({
            logs: recommendations,
            userProgress: usersWithProgress,
            stats: {
                totalUsers,
                totalRecommendations,
                popularCareers
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
