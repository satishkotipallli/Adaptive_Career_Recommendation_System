import React from 'react';
import { Search } from 'lucide-react';

const SkillSearchBar = ({
  value,
  onChange,
  onSubmit,
  buttonLabel = 'Find Careers',
  loading = false,
  className = ''
}) => (
  <form
    onSubmit={onSubmit}
    className={`flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/90 p-3 shadow-2xl shadow-slate-900/10 backdrop-blur md:flex-row ${className}`}
  >
    <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <Search className="h-5 w-5 text-slate-400" />
      <input
        value={value}
        onChange={onChange}
        placeholder="Enter your skills (e.g., python, react, machine learning)"
        className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
      />
    </div>
    <button
      type="submit"
      disabled={loading}
      className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? 'Analyzing...' : buttonLabel}
    </button>
  </form>
);

export default SkillSearchBar;

