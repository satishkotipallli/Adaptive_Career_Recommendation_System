import React from 'react';
import { BookOpen, CheckCircle2, Rocket, Target } from 'lucide-react';

const LearningPathCard = ({
  title,
  description,
  domain,
  requiredSkills,
  progress,
  onSetGoal,
  onContinue,
  isActiveCareer
}) => (
  <div className="sticky top-28 rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)]">
    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-100 via-cyan-50 to-emerald-100 text-sky-700">
      <Target className="h-7 w-7" />
    </div>

    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{domain}</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-4 text-sm leading-7 text-slate-600">{description}</p>
      </div>

      <div className="rounded-[24px] bg-slate-50 p-5">
        <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-700">
          <span className="inline-flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Progress
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-slate-950">Skills required</p>
        <div className="flex flex-wrap gap-2">
          {requiredSkills.map((skill) => (
            <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {!isActiveCareer && (
          <button
            type="button"
            onClick={onSetGoal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Rocket className="h-4 w-4" />
            Set as Active Goal
          </button>
        )}
        {isActiveCareer && (
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            <CheckCircle2 className="h-4 w-4" />
            Active Goal
          </button>
        )}
      </div>
    </div>
  </div>
);

export default LearningPathCard;

