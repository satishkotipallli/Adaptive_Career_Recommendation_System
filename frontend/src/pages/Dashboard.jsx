import React from 'react';
import { ArrowRight, Compass, Sparkles, Target } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import Sidebar from '../components/Sidebar';
import { useCareer } from '../context/CareerContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    activeCareer,
    getProgressForCareer,
    openActiveCareer,
    recommendations,
    userProgress,
    likedCareers,
    dislikedCareers
  } = useCareer();

  const completedModules = userProgress.length;
  const activeModules = activeCareer?.modules || [];
  const activeProgress = activeCareer ? getProgressForCareer(activeCareer.title, activeModules) : 0;
  const nextModule = activeModules.find(
    (module) => !userProgress.some((entry) => entry.career === activeCareer?.title && entry.moduleTitle === module.title)
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <Sidebar />
      </div>

      <div className="space-y-8">
        <section className="rounded-[36px] bg-[linear-gradient(135deg,_#0f172a_0%,_#111827_50%,_#1e293b_100%)] p-8 text-white shadow-[0_25px_70px_-35px_rgba(15,23,42,0.8)] lg:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">User Dashboard</p>
          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-4xl font-semibold">Your career workspace</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                Monitor your active career goal, continue weekly modules, and jump back into recommendations whenever you want to explore a new direction.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/recommendations')}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
            >
              Find New Recommendations
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            eyebrow="Active career"
            title={activeCareer?.title || 'No active goal yet'}
            value={activeCareer ? `${activeProgress}%` : '0%'}
            description="Track the role you are actively building toward."
            accent="from-sky-500 to-cyan-500"
          />
          <DashboardCard
            eyebrow="Completed modules"
            title="Learning milestones"
            value={String(completedModules)}
            description="Every completed module is saved to your progress log."
            accent="from-emerald-500 to-lime-500"
          />
          <DashboardCard
            eyebrow="Recommendations"
            title="Available career matches"
            value={String(recommendations.length)}
            description="Your latest AI-generated recommendations remain ready to review."
            accent="from-amber-400 to-orange-500"
          />
          <DashboardCard
            eyebrow="Next step"
            title={nextModule?.title || 'Generate a new roadmap'}
            value={activeCareer ? 'Ready' : 'Start'}
            description="Move into the next week or set a new active learning goal."
            accent="from-fuchsia-500 to-rose-500"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]" id="progress">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Active career</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950">{activeCareer?.title || 'No active career selected'}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {activeCareer
                    ? 'Your roadmap is saved and ready. Continue from the learning path page anytime.'
                    : 'Choose a recommended career to unlock a weekly roadmap and track completion here.'}
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                {activeCareer ? `${activeProgress}% complete` : 'Awaiting goal'}
              </span>
            </div>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${activeProgress}%` }}
              />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-950">Completed modules</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{completedModules}</p>
                <p className="mt-2 text-sm text-slate-500">Modules completed across your saved paths.</p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-950">Suggested next step</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{nextModule?.title || 'Open recommendations to choose a goal'}</p>
                <p className="mt-2 text-sm text-slate-500">We surface the next unfinished week from your active roadmap.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {activeCareer && (
                <button
                  type="button"
                  onClick={() => {
                    openActiveCareer();
                    navigate('/learning-path');
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Target className="h-4 w-4" />
                  Continue Learning
                </button>
              )}
              <Link
                to="/recommendations"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Compass className="h-4 w-4" />
                Browse Recommendations
              </Link>
            </div>
          </article>

          <article className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Suggested next steps</p>
            <div className="mt-6 space-y-4">
              {[
                activeCareer ? `Continue ${activeCareer.title} and finish the next unfinished week.` : 'Generate recommendations from your current skills.',
                'Review weekly theory and practical tasks before marking modules complete.',
                'Use your saved learning path as the basis for portfolio-ready mini projects.'
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-[24px] bg-slate-50 p-5">
                  <span className="mt-0.5 rounded-full bg-slate-950 p-2 text-white">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <p className="text-sm leading-7 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Personalized</p>
          <h3 className="mt-3 text-2xl font-semibold text-slate-900">Recommended Based on Your Activity</h3>
          <p className="mt-2 text-sm text-slate-600">Career suggestions derived from your likes and selected career preferences.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(recommendations.filter((r) => likedCareers.includes(r.career) || !dislikedCareers.includes(r.career)).slice(0, 6)).map((rec) => (
              <div key={rec.career} className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-700">{rec.career}</p>
                <p className="text-xs text-slate-500">Match {rec.match_percentage}%</p>
              </div>
            ))}
            {recommendations.length === 0 && <p className="text-sm text-slate-500">No activity-based suggestions yet. Like careers to get started.</p>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
