import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardCard from '../components/DashboardCard';

const AdminDashboard = ({ token }) => {
  const [logs, setLogs] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get('/api/admin/analytics', {
          headers: { 'x-auth-token': token }
        });
        setLogs(res.data.logs || []);
        setUserProgress(res.data.userProgress || []);
        setStats(res.data.stats || null);
      } catch (err) {
        console.error('Error fetching admin data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token]);

  if (loading) {
    return (
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 text-slate-600 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
        Loading Admin Dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <section className="rounded-[36px] bg-[linear-gradient(135deg,_#0f172a_0%,_#111827_50%,_#1e293b_100%)] p-8 text-white shadow-[0_25px_70px_-35px_rgba(15,23,42,0.8)] lg:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Admin Dashboard</p>
        <h1 className="mt-4 font-display text-4xl font-semibold">Portal performance and learning analytics</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          Review total users, top careers, recommendation activity, and student progress with a modern analytics layout that matches the rest of the portal.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          eyebrow="Users"
          title="Student accounts"
          value={String(stats?.totalUsers || 0)}
          description="Registered users actively using the recommendation platform."
          accent="from-sky-500 to-cyan-500"
        />
        <DashboardCard
          eyebrow="Recommendations"
          title="Recommendation logs"
          value={String(stats?.totalRecommendations || 0)}
          description="Every recommendation request is stored for visibility and analysis."
          accent="from-amber-400 to-orange-500"
        />
        <DashboardCard
          eyebrow="Top career"
          title={stats?.popularCareers?.[0]?.title || 'No data yet'}
          value={String(stats?.popularCareers?.[0]?.count || 0)}
          description="Most frequently recommended role across recent activity."
          accent="from-emerald-500 to-lime-500"
        />
        <DashboardCard
          eyebrow="Progress events"
          title="Tracked completions"
          value={String(userProgress.reduce((total, user) => total + (user.progress?.length || 0), 0))}
          description="Aggregate completed modules across all student accounts."
          accent="from-fuchsia-500 to-rose-500"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Top careers</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">Most requested paths</h2>

          <div className="mt-6 space-y-4">
            {(stats?.popularCareers || []).map((career) => (
              <div key={career.title} className="rounded-[24px] bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-base font-semibold text-slate-900">{career.title}</p>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">
                    {career.count}
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                    style={{ width: `${Math.min((career.count / Math.max(stats?.popularCareers?.[0]?.count || 1, 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">User progress analytics</p>
          <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
            <div className="grid grid-cols-[1.1fr_1fr_140px] bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              <span>User</span>
              <span>Recent activity</span>
              <span>Completed</span>
            </div>
            <div className="divide-y divide-slate-100">
              {userProgress.map((user) => (
                <div key={user._id} className="grid grid-cols-1 gap-3 px-5 py-4 text-sm text-slate-600 md:grid-cols-[1.1fr_1fr_140px]">
                  <div>
                    <p className="font-semibold text-slate-900">{user.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{user.email}</p>
                  </div>
                  <p>
                    {user.progress?.length
                      ? `${user.progress[user.progress.length - 1].career} - ${user.progress[user.progress.length - 1].moduleTitle}`
                      : 'No progress yet'}
                  </p>
                  <p className="font-semibold text-slate-900">{user.progress?.length || 0} modules</p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Recommendation logs</p>
        <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
          <div className="grid grid-cols-[1fr_1fr_120px_180px] gap-3 bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            <span>User</span>
            <span>Recommended career</span>
            <span>Score</span>
            <span>Time</span>
          </div>
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log._id} className="grid grid-cols-1 gap-3 px-5 py-4 text-sm text-slate-600 md:grid-cols-[1fr_1fr_120px_180px]">
                <span className="font-semibold text-slate-900">{log.user ? log.user.name : 'Unknown'}</span>
                <span>{log.recommended_careers[0]?.careerTitle || 'N/A'}</span>
                <span>{log.recommended_careers[0]?.score?.toFixed(2) || '0.00'}</span>
                <span>{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
