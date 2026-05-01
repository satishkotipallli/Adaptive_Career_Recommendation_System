import React, { useState } from 'react';
import { ArrowRight, Compass, Sparkles, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CareerCard from '../components/CareerCard';
import SkillSearchBar from '../components/SkillSearchBar';
import { useCareer } from '../context/CareerContext';

const CareerRecommendationsPage = () => {
  const navigate = useNavigate();
  const [showAllMissing, setShowAllMissing] = useState(false);
  const { error, fetchRecommendations, loading, recommendations, selectCareer, setSkills, skills, submitFeedback } = useCareer();

  const handleCareerFeedback = async ({ career, action, rating }) => {
    await submitFeedback({ career, action, rating });
    await fetchRecommendations(skills);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await fetchRecommendations(skills);
  };

  const handleViewPath = async (career) => {
    await selectCareer(career);
    navigate('/learning-path');
  };

  // Calculate aggregate stats
  const averageMatch = recommendations.length > 0
    ? Math.round(recommendations.reduce((sum, rec) => sum + (rec.match_percentage || 0), 0) / recommendations.length)
    : 0;

  const uniqueMissingSkills = new Set();
  recommendations.forEach((rec) => {
    (rec.missing_skills || []).forEach((skill) => {
      const skillName = typeof skill === 'string' ? skill : skill.skill;
      uniqueMissingSkills.add(skillName);
    });
  });

  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] lg:p-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Career Recommendation Page</p>
            <h1 className="mt-4 font-display text-4xl font-semibold text-slate-950">Explore roles matched to your skills</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              Search like a modern job portal, then compare career cards by domain, match score, and structured learning path availability.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[24px] bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Results</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{recommendations.length}</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Avg Match</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-600">{averageMatch}%</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <SkillSearchBar
            value={skills}
            onChange={(event) => setSkills(event.target.value)}
            onSubmit={handleSubmit}
            buttonLabel="Find Careers"
            loading={loading}
          />
          {error && <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}
        </div>

        {/* Skills Summary Card */}
        {recommendations.length > 0 && uniqueMissingSkills.size > 0 && (
          <div className="mt-8 rounded-[24px] bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-950">Skills to focus on</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Across all recommendations, you need to learn <span className="font-semibold text-blue-600">{uniqueMissingSkills.size} unique skills</span> to be fully prepared.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {Array.from(uniqueMissingSkills).slice(0, 6).map((skill) => (
                    <span key={skill} className="inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm border border-blue-200">
                      {skill}
                    </span>
                  ))}
                  {uniqueMissingSkills.size > 6 && (
                    <button
                      type="button"
                      onClick={() => setShowAllMissing((prev) => !prev)}
                      className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-medium text-blue-600 shadow-sm border border-blue-200 hover:bg-blue-50"
                    >
                      {showAllMissing ? 'Show less' : `+${uniqueMissingSkills.size - 6} more`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full missing skills list for explicit +more control */}
        {showAllMissing && uniqueMissingSkills.size > 0 && (
          <section className="mt-4 rounded-[24px] bg-white border border-blue-200 p-5">
            <p className="text-sm font-semibold text-blue-700 mb-3">All skills to focus on:</p>
            <div className="flex flex-wrap gap-2">
              {Array.from(uniqueMissingSkills).map((skill) => (
                <span key={skill} className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-100">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}
      </section>

      {recommendations.length > 0 ? (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.map((recommendation) => (
            <CareerCard
              key={recommendation.career}
              recommendation={recommendation}
              onViewPath={() => handleViewPath(recommendation.career)}
              onFeedback={(feedback) => handleCareerFeedback({ ...feedback, career: recommendation.career })}
            />
          ))}
        </section>
      ) : (
        <section className="rounded-[36px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <div className="mx-auto max-w-2xl">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-900 shadow-sm">
              <Compass className="h-7 w-7" />
            </span>
            <h2 className="mt-6 text-2xl font-semibold text-slate-950">No recommendations yet</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Start with a skill search to populate this job-listing style grid. Once results arrive, each card can open its dedicated learning path page.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Sparkles className="h-4 w-4" />
              Back to Home
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default CareerRecommendationsPage;
