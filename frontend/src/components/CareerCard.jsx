import React, { useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Sparkles, AlertCircle } from 'lucide-react';
import FeedbackButtons from './FeedbackButtons';

const CareerCard = ({ recommendation, onViewPath, onFeedback }) => {
  const [showMoreGap, setShowMoreGap] = useState(false);
  const missingSkills = recommendation.missing_skills || [];
  const matchedSkills = recommendation.matched_skills || [];
  
  // Get top 3 missing skills to display
  const topMissingSkills = showMoreGap ? missingSkills : missingSkills.slice(0, 3);

  return (
    <article className="group rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-2 hover:border-slate-300 hover:shadow-[0_30px_80px_-35px_rgba(15,23,42,0.45)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 text-orange-600">
          <BriefcaseBusiness className="h-6 w-6" />
        </div>
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
          {recommendation.match_percentage}% match
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">{recommendation.career}</h3>
          <span className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {recommendation.domain}
          </span>
        </div>

        <p className="text-sm leading-6 text-slate-600">
          This role aligns with your current skill set and offers a guided path toward practical projects, portfolio work, and job-ready growth.
        </p>

        {/* Matched Skills Section */}
        {matchedSkills.length > 0 && (
          <div className="rounded-lg bg-green-50 p-3 border border-green-200">
            <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
              ✅ You already have ({matchedSkills.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.slice(0, 4).map((skill) => (
                <span key={skill} className="inline-flex text-xs bg-green-200 text-green-800 rounded-full px-2.5 py-1 font-medium">
                  {skill}
                </span>
              ))}
              {matchedSkills.length > 4 && (
                <span className="text-xs text-green-600 px-2.5 py-1">+{matchedSkills.length - 4} more</span>
              )}
            </div>
          </div>
        )}

        {/* Missing Skills Section */}
        {topMissingSkills.length > 0 && (
          <div className="rounded-lg bg-red-50 p-3 border border-red-200">
            <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Skills to learn ({missingSkills.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {topMissingSkills.map((item) => {
                const skillName = typeof item === 'string' ? item : item.skill;
                const priority = typeof item === 'object' ? item.priority : null;
                
                return (
                  <div
                    key={skillName}
                    className="flex items-center gap-1.5 text-xs bg-red-200 text-red-800 rounded-full px-2.5 py-1 font-medium whitespace-nowrap"
                    title={skillName}
                  >
                    <span>{skillName}</span>
                    {priority && priority > 0.8 && (
                      <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-red-600"></span>
                    )}
                  </div>
                );
              })}

              {missingSkills.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowMoreGap((prev) => !prev)}
                  className="text-xs font-semibold text-red-700 underline hover:text-red-900"
                >
                  {showMoreGap ? 'Show less' : `+${missingSkills.length - topMissingSkills.length} more`}
                </button>
              )}
            </div>
          </div>
        )}

        {onFeedback && (
          <FeedbackButtons
            career={recommendation.career}
            onFeedback={onFeedback}
            currentLike={recommendation.user_preference === 1}
            currentDislike={recommendation.user_preference === -1}
            currentRating={Math.round((recommendation.feedback_score || 0) / 20)}
          />
        )}

        <button
          type="button"
          onClick={onViewPath}
          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 w-full justify-center"
        >
          <Sparkles className="h-4 w-4" />
          View Learning Path
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </button>
      </div>
    </article>
  );
};

export default CareerCard;

