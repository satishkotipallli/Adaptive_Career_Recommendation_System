import React from 'react';
import { ArrowRight, CheckCircle2, GraduationCap, Orbit, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import { useCareer } from '../context/CareerContext';

const featureCards = [
  {
    title: 'AI Recommendations',
    copy: 'Match your current skill profile to the most relevant career roles and surface clear next steps.',
    icon: Sparkles
  },
  {
    title: 'Weekly Learning Plans',
    copy: 'Follow structured week-by-week roadmaps with theory, tasks, mini projects, and tutorials.',
    icon: GraduationCap
  },
  {
    title: 'Progress Tracking',
    copy: 'Turn learning into momentum with active goals, completion tracking, and admin visibility.',
    icon: Orbit
  }
];

const HomePage = ({ token }) => {
  const navigate = useNavigate();
  const { fetchRecommendations, loading, setSkills, skills } = useCareer();

  const handleHeroSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      navigate('/login');
      return;
    }

    const result = await fetchRecommendations(skills);

    if (result.ok) {
      navigate('/recommendations');
    }
  };

  return (
    <div className="space-y-10 pb-12">
      <HeroSection skills={skills} setSkills={setSkills} onSubmit={handleHeroSubmit} loading={loading} />

      <section className="grid gap-6 lg:grid-cols-3">
        {featureCards.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-1"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.copy}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-8 rounded-[36px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">How it works</p>
          <h2 className="mt-4 font-display text-3xl font-semibold text-slate-950">A familiar job-portal flow, redesigned for career planning</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Search with your skills, review match-based career cards, and open a detailed learning path that feels like a polished job detail page.
          </p>
          <button
            type="button"
            onClick={() => navigate(token ? '/recommendations' : '/register')}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Explore the Portal
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4">
          {[
            'Enter your technical and domain skills.',
            'Review AI-ranked careers in a listing-style layout.',
            'Open a learning path and follow weekly modules.',
            'Track progress from your personalized dashboard.'
          ].map((step) => (
            <div key={step} className="flex items-start gap-3 rounded-[24px] bg-slate-50 p-5">
              <span className="mt-0.5 rounded-full bg-emerald-100 p-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <p className="text-sm font-medium leading-6 text-slate-700">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
