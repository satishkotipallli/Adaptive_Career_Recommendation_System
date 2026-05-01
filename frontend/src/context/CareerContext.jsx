import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const CareerContext = createContext(null);

const splitSkills = (value) =>
  String(value || '')
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);

const titleToDescription = (title, domain, skills) => {
  const highlightedSkills = splitSkills(skills).slice(0, 3).join(', ');
  const base = `${title} sits in the ${domain || 'technology'} space and blends practical delivery with in-demand digital skills.`;

  if (!highlightedSkills) {
    return `${base} This path is structured to help you build a portfolio, strengthen your fundamentals, and move toward job-ready execution.`;
  }

  return `${base} Based on your current strengths in ${highlightedSkills}, this roadmap focuses on turning what you already know into a clear career progression.`;
};

const deriveRequiredSkills = (modules, skills, domain) => {
  const toolSkills = (modules || [])
    .flatMap((module) => module.recommended_tools || [])
    .map((skill) => String(skill).trim())
    .filter(Boolean);

  const userSkills = splitSkills(skills);
  const fallback = [`${domain || 'Core'} fundamentals`, 'Problem solving', 'Project building', 'Communication'];

  return [...new Set([...userSkills, ...toolSkills, ...fallback])].slice(0, 8);
};

export const CareerProvider = ({ children, token }) => {
  const [skills, setSkills] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [careerModules, setCareerModules] = useState(null);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [userProgress, setUserProgress] = useState([]);
  const [activeCareer, setActiveCareer] = useState(null);
  const [likedCareers, setLikedCareers] = useState([]);
  const [dislikedCareers, setDislikedCareers] = useState([]);
  const [error, setError] = useState('');

  const config = token
    ? {
        headers: {
          'x-auth-token': token
        }
      }
    : null;

  const clearRecommendationState = () => {
    setSelectedCareer(null);
    setCareerModules(null);
  };

  const fetchProgress = async () => {
    if (!config) return;

    try {
      const [progressRes, userRes] = await Promise.all([
        axios.get('/api/progress', config),
        axios.get('/api/auth/me', config)
      ]);

      setUserProgress(progressRes.data.progress || []);
      setActiveCareer(progressRes.data.activeCareer?.title ? progressRes.data.activeCareer : null);
      setLikedCareers(userRes.data.liked_careers || []);
      setDislikedCareers(userRes.data.disliked_careers || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProgress();
    } else {
      setRecommendations([]);
      setUserProgress([]);
      setActiveCareer(null);
      clearRecommendationState();
    }
  }, [token]);

  const fetchRecommendations = async (overrideSkills) => {
    if (!config) return { ok: false, reason: 'auth' };

    const nextSkills = typeof overrideSkills === 'string' ? overrideSkills : skills;

    if (!nextSkills.trim()) {
      setError('Please enter some skills.');
      return { ok: false, reason: 'skills' };
    }

    setError('');
    setLoading(true);
    clearRecommendationState();

    try {
      const skillList = splitSkills(nextSkills);
      const res = await axios.post('/api/recommend/career', { skills: skillList }, config);
      setSkills(nextSkills);
      const recs = res.data?.recommendations || [];
      
      // Fetch skill gap analysis for each recommendation
      const recommendationsWithGaps = await Promise.all(
        (recs || []).map(async (rec) => {
          try {
            const gapRes = await axios.post(
              '/api/recommend/skill-gap',
              { skills: skillList, career: rec.career },
              config
            );
            return {
              ...rec,
              missing_skills: gapRes.data.missing_skills || [],
              matched_skills: gapRes.data.matched_skills || [],
              skill_gap: gapRes.data
            };
          } catch (gapErr) {
            console.error(`Error fetching skill gap for ${rec.career}:`, gapErr);
            return rec;
          }
        })
      );
      
      setRecommendations(recommendationsWithGaps);
      return { ok: true, data: recommendationsWithGaps };
    } catch (err) {
      console.error(err);
      setError('Error fetching recommendations.');
      return { ok: false, reason: 'request' };
    } finally {
      setLoading(false);
    }
  };

  const selectCareer = async (career) => {
    if (!config || !career) return;

    setSelectedCareer(career);
    setModuleLoading(true);
    setError('');

    try {
      const res = await axios.post(
        '/api/recommend/details',
        { career, skills: splitSkills(skills) },
        config
      );
      setCareerModules(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load career details.');
    } finally {
      setModuleLoading(false);
    }
  };

  const openActiveCareer = () => {
    if (!activeCareer?.title) return;
    setSelectedCareer(activeCareer.title);
    setCareerModules({ modules: activeCareer.modules || [] });
  };

  const enrollInCareer = async () => {
    if (!config || !selectedCareer || !careerModules?.modules) return false;

    try {
      const res = await axios.post(
        '/api/progress/enroll',
        {
          career: selectedCareer,
          modules: careerModules.modules
        },
        config
      );
      setActiveCareer(res.data);
      await fetchProgress();
      return true;
    } catch (err) {
      console.error(err);
      setError('Error enrolling in career.');
      return false;
    }
  };

  const markModuleComplete = async (moduleTitle) => {
    if (!config || !selectedCareer || !moduleTitle) return false;

    try {
      await axios.post('/api/progress', { career: selectedCareer, moduleTitle }, config);
      await submitModuleFeedback({ career: selectedCareer, module: moduleTitle, completed: true });
      await fetchProgress();
      return true;
    } catch (err) {
      console.error(err);
      setError('Error saving progress.');
      return false;
    }
  };

  const isModuleCompleted = (careerTitle, moduleTitle) =>
    userProgress.some((entry) => entry.career === careerTitle && entry.moduleTitle === moduleTitle);

  const submitFeedback = async ({ career, action, rating }) => {
    if (!config) return { ok: false, reason: 'auth' };

    try {
      const res = await axios.post('/api/recommend/feedback', { career, action, rating }, config);
      // optimistic update in current recommendations
      const updatedLiked = action === 'like' ? [...new Set([...likedCareers, career])] : likedCareers.filter((c) => c !== career);
      const updatedDisliked = action === 'dislike' ? [...new Set([...dislikedCareers, career])] : dislikedCareers.filter((c) => c !== career);

      setLikedCareers(updatedLiked);
      setDislikedCareers(updatedDisliked);

      setRecommendations((prev) =>
        prev.map((rec) =>
          rec.career === career
            ? {
                ...rec,
                user_preference: action === 'like' ? 1 : action === 'dislike' ? -1 : rec.user_preference,
                feedback_score: rating ? Number(((rating / 5) * 100).toFixed(0)) : rec.feedback_score
              }
            : rec
        )
      );

      return { ok: true, data: res.data };
    } catch (err) {
      console.error(err);
      return { ok: false, reason: 'request' };
    }
  };

  const submitModuleFeedback = async ({ career, module, completed, rating }) => {
    if (!config) return { ok: false, reason: 'auth' };

    try {
      const res = await axios.post('/api/recommend/module-feedback', { career, module, completed, rating }, config);
      await fetchProgress();
      return { ok: true, data: res.data };
    } catch (err) {
      console.error(err);
      return { ok: false, reason: 'request' };
    }
  };

  const getProgressForCareer = (careerTitle, modules = []) => {
    if (!careerTitle || modules.length === 0) return 0;
    const completedCount = modules.filter((module) => isModuleCompleted(careerTitle, module.title)).length;
    return Math.round((completedCount / modules.length) * 100);
  };

  const selectedCareerMeta =
    recommendations.find((item) => item.career === selectedCareer) ||
    (activeCareer?.title === selectedCareer
      ? {
          career: activeCareer.title,
          domain: 'Active learning path',
          match_percentage: getProgressForCareer(activeCareer.title, activeCareer.modules || [])
        }
      : null);

  const currentModules = careerModules?.modules || [];
  const currentProgress = getProgressForCareer(selectedCareer, currentModules);

  const value = {
    activeCareer,
    careerModules,
    clearRecommendationState,
    currentModules,
    currentProgress,
    enrollInCareer,
    error,
    fetchProgress,
    fetchRecommendations,
    getProgressForCareer,
    isModuleCompleted,
    loading,
    markModuleComplete,
    moduleLoading,
    openActiveCareer,
    recommendations,
    selectedCareer,
    selectedCareerMeta,
    selectCareer,
    setError,
    setSkills,
    skills,
    likedCareers,
    dislikedCareers,
    submitFeedback,
    submitModuleFeedback,
    userProgress,
    titleToDescription,
    deriveRequiredSkills
  };

  return <CareerContext.Provider value={value}>{children}</CareerContext.Provider>;
};

export const useCareer = () => {
  const context = useContext(CareerContext);

  if (!context) {
    throw new Error('useCareer must be used inside CareerProvider');
  }

  return context;
};

