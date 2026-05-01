import React, { useState } from 'react';
import { ChevronDown, CircleCheckBig, FolderKanban, GraduationCap, Youtube } from 'lucide-react';

const contentBlocks = [
  { key: 'theory', label: 'Theory', icon: GraduationCap, tone: 'bg-sky-50 text-sky-900' },
  { key: 'questions', label: 'Knowledge Check', icon: CircleCheckBig, tone: 'bg-emerald-50 text-emerald-900' },
  { key: 'practical_tasks', label: 'Tasks', icon: FolderKanban, tone: 'bg-amber-50 text-amber-900' }
];

const WeekAccordion = ({ module, completed, onComplete }) => {
  const [open, setOpen] = useState(false);

  return (
    <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-slate-50"
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Weekly Roadmap
            </span>
            {completed && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Completed
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-slate-950">{module.title}</h3>
          <p className="mt-2 text-sm text-slate-500">{module.youtube_query}</p>
        </div>
        <span className={`rounded-full border border-slate-200 p-3 transition ${open ? 'rotate-180 bg-slate-950 text-white' : 'bg-white text-slate-500'}`}>
          <ChevronDown className="h-5 w-5" />
        </span>
      </button>

      <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="border-t border-slate-100 px-6 py-6">
            <div className="grid gap-4">
              {contentBlocks.map(({ key, label, icon: Icon, tone }) => {
                const value = module[key];

                if (!value || (Array.isArray(value) && value.length === 0)) {
                  return null;
                }

                return (
                  <section key={key} className={`rounded-[24px] p-5 ${tone}`}>
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <Icon className="h-4 w-4" />
                      {label}
                    </div>
                    {Array.isArray(value) ? (
                      <ul className="space-y-2 text-sm leading-6">
                        {value.map((item) => (
                          <li key={item} className="rounded-2xl bg-white/70 px-4 py-3">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm leading-7">{value}</p>
                    )}
                  </section>
                );
              })}

              {module.mini_project && (
                <section className="rounded-[24px] bg-violet-50 p-5 text-violet-950">
                  <p className="mb-3 text-sm font-semibold">Mini Project</p>
                  <p className="text-sm leading-7">{module.mini_project}</p>
                </section>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(module.youtube_query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Youtube className="h-4 w-4 text-rose-500" />
                  Search Tutorials
                </a>
                {!completed && (
                  <button
                    type="button"
                    onClick={onComplete}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                  >
                    <CircleCheckBig className="h-4 w-4" />
                    Mark as Completed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default WeekAccordion;

