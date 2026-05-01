import React from 'react';

const DashboardCard = ({ eyebrow, title, value, description, accent = 'from-sky-500 to-cyan-500' }) => (
  <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]">
    <div className={`mb-5 h-1.5 w-20 rounded-full bg-gradient-to-r ${accent}`} />
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{eyebrow}</p>
    <h3 className="mt-4 text-3xl font-semibold text-slate-950">{value}</h3>
    <p className="mt-2 text-base font-semibold text-slate-700">{title}</p>
    <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
  </article>
);

export default DashboardCard;

