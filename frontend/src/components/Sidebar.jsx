import React from 'react';
import { BarChart3, Compass, LayoutDashboard, Route, Sparkles } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'My Learning Paths', to: '/learning-path', icon: Sparkles },
  { label: 'Progress', to: '/dashboard#progress', icon: BarChart3 },
  { label: 'Recommendations', to: '/recommendations', icon: Route },
  { label: 'Explore', to: '/', icon: Compass }
];

const Sidebar = () => (
  <aside className="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_25px_70px_-35px_rgba(15,23,42,0.8)]">
    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Workspace</p>
    <div className="mt-8 space-y-2">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActive ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        );
      })}
    </div>
  </aside>
);

export default Sidebar;

