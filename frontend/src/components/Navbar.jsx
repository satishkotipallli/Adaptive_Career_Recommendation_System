import React from 'react';
import { BriefcaseBusiness, LayoutDashboard, LogOut, Route, Shield, Sparkles } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

const baseLink =
  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white/80 hover:text-slate-900';

const activeLink = 'bg-white text-slate-950 shadow-sm';

const Navbar = ({ token, role, onLogout }) => (
  <header className="sticky top-0 z-40 border-b border-white/20 bg-slate-950/85 backdrop-blur-xl">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <Link to="/" className="flex items-center gap-3 text-white">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 text-slate-950 shadow-lg shadow-orange-500/20">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">AI Career Portal</p>
          <p className="text-base font-semibold">Career Guidance AI</p>
        </div>
      </Link>

      <nav className="hidden items-center gap-2 lg:flex ">
        <NavLink to="/" className={({ isActive }) => `${baseLink} ${isActive ? activeLink : ''}`}>
          <BriefcaseBusiness className="h-4 w-4" />
          Home
        </NavLink>
        {token && role !== 'admin' && (
          <>
            <NavLink to="/recommendations" className={({ isActive }) => `${baseLink} ${isActive ? activeLink : ''}`}>
              <Route className="h-4 w-4" />
              Careers
            </NavLink>
            <NavLink to="/learning-path" className={({ isActive }) => `${baseLink} ${isActive ? activeLink : ''}`}>
              <Sparkles className="h-4 w-4" />
              Learning Path
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => `${baseLink} ${isActive ? activeLink : ''}`}>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </NavLink>
          </>
        )}
        {token && role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => `${baseLink} ${isActive ? activeLink : ''}`}>
            <Shield className="h-4 w-4" />
            Admin
          </NavLink>
        )}
      </nav>

      <div className="flex items-center gap-3">
        {token ? (
          <button
            onClick={onLogout}
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        ) : (
          <>
            <Link to="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-200 transition hover:text-white">
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/25 transition hover:-translate-y-0.5"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </div>
  </header>
);

export default Navbar;

