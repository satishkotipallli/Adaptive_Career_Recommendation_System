const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   POST api/progress
// @desc    Mark a module as completed
// @access  Private
router.post('/', auth, async (req, res) => {
  const { career, moduleTitle } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Check if already completed
    const alreadyCompleted = user.progress.some(
      p => p.career === career && p.moduleTitle === moduleTitle
    );

    if (!alreadyCompleted) {
      user.progress.push({ career, moduleTitle });
      await user.save();
    }

    res.json(user.progress);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/progress/enroll
// @desc    Enroll in a career path (save modules)
// @access  Private
router.post('/enroll', auth, async (req, res) => {
  const { career, modules } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.activeCareer = {
        title: career,
        modules: modules
    };
    await user.save();
    res.json(user.activeCareer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/progress
// @desc    Get user progress and active career
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('progress activeCareer');
    res.json({
        progress: user.progress,
        activeCareer: user.activeCareer
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
