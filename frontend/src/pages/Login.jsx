import React, { useState } from 'react';
import axios from 'axios';
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getRoleFromToken } from '../utils/auth';

const Login = ({ setToken }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { email, password } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      navigate(getRoleFromToken(res.data.token) === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
    }
  };

  return (
    <section className="grid overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_28px_80px_-35px_rgba(15,23,42,0.35)] lg:grid-cols-[0.95fr_1.05fr]">
      <aside className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.28),_transparent_26%),linear-gradient(150deg,_#0f172a_0%,_#111827_45%,_#1e293b_100%)] p-10 text-white">
        <div className="relative z-10 max-w-md space-y-6">
          <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-slate-200">
            Career portal access
          </span>
          <h1 className="font-display text-4xl font-semibold">Welcome Back</h1>
          <p className="text-sm leading-7 text-slate-300">
            Sign in to continue your personalized learning path, review fresh AI recommendations, and track your weekly progress.
          </p>
          <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-white/15 p-3 text-amber-300">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold">Personalized dashboard</p>
                <p className="text-sm text-slate-300">Resume learning from your active goal in one click.</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="p-8 sm:p-10 lg:p-12">
        <div className="mx-auto max-w-md">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">Login</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950">Access your workspace</h2>
          </div>

          {error && <p className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                name="email"
                value={email}
                onChange={onChange}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                name="password"
                value={password}
                onChange={onChange}
                minLength="6"
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <LockKeyhole className="h-4 w-4" />
              Login
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            New here?{' '}
            <Link to="/register" className="inline-flex items-center gap-1 font-semibold text-slate-950">
              Create an account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Login;
