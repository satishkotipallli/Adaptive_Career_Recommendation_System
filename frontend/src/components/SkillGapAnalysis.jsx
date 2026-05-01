import React, { useState } from 'react';
import axios from 'axios';

const SkillGapAnalysis = ({ skills = [], career = '', token }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCareer, setSelectedCareer] = useState(career);
  const [userSkills, setUserSkills] = useState(skills.join(', '));

  const analyzeSkillGap = async () => {
    if (!userSkills.trim() || !selectedCareer.trim()) {
      setError('Please provide both skills and a career');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const skillsList = userSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/recommend/skill-gap`,
        {
          skills: skillsList,
          career: selectedCareer.trim()
        },
        {
          headers: {
            'x-auth-token': token
          }
        }
      );

      setAnalysis(response.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to analyze skill gap');
      console.error('Skill gap analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      ready: 'bg-green-100 border-green-400 text-green-800',
      intermediate: 'bg-blue-100 border-blue-400 text-blue-800',
      beginner_advanced: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      beginner: 'bg-orange-100 border-orange-400 text-orange-800'
    };
    return colors[status] || colors.beginner;
  };

  const getStatusIcon = (status) => {
    const icons = {
      ready: '✅',
      intermediate: '💪',
      beginner_advanced: '📚',
      beginner: '🚀'
    };
    return icons[status] || '📊';
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 bg-white rounded-lg shadow-lg">
      {/* Input Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Skill Gap Analysis</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Skills Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Skills (comma-separated)
            </label>
            <textarea
              value={userSkills}
              onChange={(e) => setUserSkills(e.target.value)}
              placeholder="e.g., React, Node.js, MongoDB, JavaScript"
              className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {userSkills.split(',').filter((s) => s.trim()).length} skills added
            </p>
          </div>

          {/* Career Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Career
            </label>
            <input
              type="text"
              value={selectedCareer}
              onChange={(e) => setSelectedCareer(e.target.value)}
              placeholder="e.g., Full Stack Developer"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the career you want to pursue
            </p>
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={analyzeSkillGap}
          disabled={loading}
          className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition duration-200"
        >
          {loading ? 'Analyzing...' : 'Analyze Skill Gap'}
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-800 rounded-lg">
            <p className="font-semibold">❌ Error</p>
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Results Section */}
      {analysis && !error && (
        <div className="space-y-6">
          {/* Status Card */}
          <div className={`p-6 border-l-4 rounded-lg ${getStatusColor(analysis.status)}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">
                  {getStatusIcon(analysis.status)} {analysis.message}
                </h3>
                <p className="text-sm opacity-90">
                  Career: <span className="font-semibold">{analysis.career}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{analysis.match_percentage}%</div>
                <p className="text-sm opacity-90 mt-1">Match</p>
              </div>
            </div>
          </div>

          {/* Match Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm font-medium">Your Skills</p>
              <p className="text-2xl font-bold text-gray-800">
                {analysis.skill_count.user}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm font-medium">Required Skills</p>
              <p className="text-2xl font-bold text-gray-800">
                {analysis.skill_count.required}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-gray-600 text-sm font-medium">Matched Skills</p>
              <p className="text-2xl font-bold text-green-600">
                {analysis.skill_count.matched}
              </p>
            </div>
          </div>

          {/* Matched Skills */}
          {analysis.matched_skills && analysis.matched_skills.length > 0 && (
            <div className="bg-green-50 p-6 rounded-lg border border-green-300">
              <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                <span className="mr-2">✅</span> Skills You Already Have ({analysis.matched_skills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.matched_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-green-200 text-green-800 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing Skills */}
          {analysis.missing_skills && analysis.missing_skills.length > 0 && (
            <div className="bg-red-50 p-6 rounded-lg border border-red-300">
              <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center">
                <span className="mr-2">❌</span> Skills You Need to Learn ({analysis.missing_skills.length})
              </h3>

              {/* Prioritized Missing Skills */}
              <div className="space-y-3">
                {analysis.missing_skills.map((item, idx) => {
                  const skill = typeof item === 'string' ? item : item.skill;
                  const priority = typeof item === 'object' ? item.priority : null;
                  const level = typeof item === 'object' ? item.level : 'intermediate';

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200 hover:shadow-md transition"
                    >
                      <div className="flex items-center flex-1">
                        <span className="text-2xl mr-4">
                          {idx + 1 <= 2 ? '🔴' : '🟡'}
                        </span>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{skill}</p>
                          <p className="text-xs text-gray-500 capitalize">{level}</p>
                        </div>
                      </div>

                      {/* Priority Bar */}
                      {priority && (
                        <div className="ml-4 flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full"
                              style={{ width: `${priority * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 font-medium">
                            {Math.round(priority * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Learning Path */}
          {analysis.learning_path && (
            <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-300">
              <h3 className="text-lg font-bold text-indigo-800 mb-4 flex items-center">
                <span className="mr-2">📚</span> Your Learning Path
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-indigo-800">Phase:</span>{' '}
                    <span className="capitalize">{analysis.learning_path.phase}</span>
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-indigo-800">Focus:</span>{' '}
                    <span className="capitalize">
                      {analysis.learning_path.focus.replace(/_/g, ' ')}
                    </span>
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-indigo-800">Recommendation:</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {analysis.learning_path.recommendation}
                  </p>
                </div>

                {analysis.learning_path.skills_to_learn &&
                  analysis.learning_path.skills_to_learn.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-indigo-800 mb-2">
                        Focus Skills to Learn:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.learning_path.skills_to_learn.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-indigo-200 text-indigo-800 rounded-full text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {analysis.learning_path.timeline && (
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold text-indigo-800">Timeline:</span>{' '}
                      {analysis.learning_path.timeline}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No Skills Alert */}
          {analysis.matched_skills.length === 0 && (
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-300">
              <p className="text-yellow-800 font-semibold">
                💡 You're starting from scratch! Don't worry—everyone begins here. Follow the
                learning path above and you'll be job-ready soon.
              </p>
            </div>
          )}

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 rounded-lg text-white">
            <h3 className="text-lg font-bold mb-2">Next Steps</h3>
            <p className="text-sm mb-4">
              {analysis.match_percentage >= 90
                ? '🎯 You are ready for this role! Start applying to positions and prepare for interviews.'
                : analysis.match_percentage >= 70
                ? '💪 You are close! Focus on the missing skills and you will be ready soon.'
                : analysis.match_percentage >= 40
                ? '📚 Build a strong foundation by learning the top priority skills listed above.'
                : '🚀 Start your learning journey with the fundamentals. Follow the learning path and track your progress.'}
            </p>
            <button className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition">
              View Learning Resources
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !loading && !error && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            👆 Enter your skills and target career to analyze your skill gap
          </p>
        </div>
      )}
    </div>
  );
};

export default SkillGapAnalysis;
