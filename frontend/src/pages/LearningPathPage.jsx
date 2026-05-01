import React, { useEffect } from 'react';
import { ArrowLeft, Rocket } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import LearningPathCard from '../components/LearningPathCard';
import WeekAccordion from '../components/WeekAccordion';
import { useCareer } from '../context/CareerContext';

const LearningPathPage = () => {
  const navigate = useNavigate();
  const {
    activeCareer,
    currentModules,
    currentProgress,
    deriveRequiredSkills,
    enrollInCareer,
    error,
    markModuleComplete,
    moduleLoading,
    openActiveCareer,
    selectedCareer,
    selectedCareerMeta,
    skills,
    titleToDescription,
    isModuleCompleted,
    submitModuleFeedback
  } = useCareer();

  const [justCompletedModule, setJustCompletedModule] = React.useState(null);
  const [moduleRating, setModuleRating] = React.useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = React.useState(false);


  const isActiveCareer = activeCareer?.title === selectedCareer;
  const requiredSkills = deriveRequiredSkills(currentModules, skills, selectedCareerMeta?.domain);

  const handleSetGoal = async () => {
    const success = await enrollInCareer();
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleModuleComplete = async (moduleTitle) => {
    const done = await markModuleComplete(moduleTitle);
    if (done) {
      setJustCompletedModule(moduleTitle);
      setModuleRating(0);
      setShowFeedbackModal(true);
    }
  };

  const handleSubmitModuleRating = async () => {
    if (!justCompletedModule) return;
    await submitModuleFeedback({ career: selectedCareer, module: justCompletedModule, completed: true, rating: moduleRating });
    setShowFeedbackModal(false);
  };

  useEffect(() => {
    if (!selectedCareer && activeCareer) {
      openActiveCareer();
    }
  }, [activeCareer, openActiveCareer, selectedCareer]);

  if (!selectedCareer && !activeCareer) {
    return (
      <section className="rounded-[36px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
        <h1 className="text-3xl font-semibold text-slate-950">No learning path selected</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Choose a recommendation first, then open its detailed weekly roadmap here.
        </p>
        <Link
          to="/recommendations"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Rocket className="h-4 w-4" />
          View Recommendations
        </Link>
      </section>
    );
  }

  if (!selectedCareer && activeCareer) {
    return (
      <section className="rounded-[32px] border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
        Loading your active learning path...
      </section>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/recommendations')}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Recommendations
        </button>
        {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <LearningPathCard
          title={selectedCareer}
          description={titleToDescription(selectedCareer, selectedCareerMeta?.domain, skills)}
          domain={selectedCareerMeta?.domain || 'Career Path'}
          requiredSkills={requiredSkills}
          progress={currentProgress}
          onSetGoal={handleSetGoal}
          onContinue={() => navigate('/dashboard')}
          isActiveCareer={isActiveCareer}
        />

        <section className="space-y-5">
          <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Learning Path Page</p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-950">{selectedCareer}</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Follow this roadmap like a job detail page: review each week, study the theory, attempt the knowledge checks, finish the tasks, and complete the mini project.
            </p>
          </div>

          {moduleLoading ? (
            <div className="rounded-[32px] border border-slate-200 bg-white p-7 text-sm text-slate-600 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
              Generating personalized curriculum...
            </div>
          ) : (
            currentModules.map((module) => (
              <WeekAccordion
                key={module.title}
                module={module}
                completed={isModuleCompleted(selectedCareer, module.title)}
                onComplete={() => handleModuleComplete(module.title)}
              />
            ))
          )}
        </section>
      </div>

      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900">How useful was this learning path?</h3>
            <p className="mt-2 text-sm text-slate-600">Module: {justCompletedModule}</p>
            <div className="mt-4">
              <label className="text-sm font-medium text-slate-700">Rating (1-5 stars)</label>
              <div className="mt-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setModuleRating(score)}
                    className={`rounded-full px-3 py-1 ${moduleRating >= score ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowFeedbackModal(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
                Skip
              </button>
              <button
                onClick={handleSubmitModuleRating}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPathPage;
