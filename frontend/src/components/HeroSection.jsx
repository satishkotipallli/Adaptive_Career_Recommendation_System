import React from 'react';
import { BriefcaseBusiness, TrendingUp, UserCheck } from 'lucide-react';
import SkillSearchBar from './SkillSearchBar';

const stats = [
  { label: 'Career tracks', value: '100+', icon: BriefcaseBusiness },
  { label: 'AI-powered matching', value: 'Smart', icon: TrendingUp },
  { label: 'Guided weekly plans', value: '12 Weeks', icon: UserCheck }
];

const HeroSection = ({ skills, setSkills, onSubmit, loading }) => (
  <section className="relative overflow-hidden rounded-[40px] bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.35),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.22),_transparent_30%),linear-gradient(135deg,_#0f172a_0%,_#111827_50%,_#1e293b_100%)] px-6 py-16 text-white shadow-[0_35px_90px_-35px_rgba(15,23,42,0.85)] sm:px-10 lg:px-14 lg:py-20">
    <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent)] lg:block" />
    <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-8">
        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100">
          Smarter guidance for career discovery
        </span>
        <div className="space-y-5">
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            Find Your Perfect Career Path with AI
          </h1>
          <p className="max-w-2xl text-lg text-slate-300 sm:text-xl">
            Get personalized career recommendations and learning paths
          </p>
        </div>
        <SkillSearchBar
          value={skills}
          onChange={(event) => setSkills(event.target.value)}
          onSubmit={onSubmit}
          buttonLabel="Find Careers"
          loading={loading}
        />
      </div>

      <div className="grid gap-5 lg:pl-8">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="group rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/15"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-amber-300">
                <Icon className="h-6 w-6" />
              </div>
              <p className="text-3xl font-semibold">{item.value}</p>
              <p className="mt-2 text-sm text-slate-300">{item.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default HeroSection;

