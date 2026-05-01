import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import { CareerProvider } from './context/CareerContext';
import { getRoleFromToken } from './utils/auth';
import AdminDashboard from './pages/AdminDashboard';
import CareerRecommendationsPage from './pages/CareerRecommendationsPage';
import Dashboard from './pages/Dashboard';
import HomePage from './pages/HomePage';
import LearningPathPage from './pages/LearningPathPage';
import Login from './pages/Login';
import Register from './pages/Register';

const ProtectedRoute = ({ allowedRoles, role, token, children }) => {
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(getRoleFromToken(localStorage.getItem('token')));

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setRole(null);
  };

  useEffect(() => {
    setRole(getRoleFromToken(token));
  }, [token]);

  return (
    <Router>
      <CareerProvider token={token}>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.15),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_22%),linear-gradient(180deg,_#fffaf5_0%,_#f8fafc_50%,_#f1f5f9_100%)]">
          <Navbar token={token} role={role} onLogout={logout} />

          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <Routes>
              <Route path="/" element={<HomePage token={token} />} />
              <Route path="/login" element={token ? <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Login setToken={setToken} />} />
              <Route path="/register" element={token ? <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Register setToken={setToken} />} />
              <Route
                path="/recommendations"
                element={
                  <ProtectedRoute allowedRoles={['student']} role={role} token={token}>
                    <CareerRecommendationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/learning-path"
                element={
                  <ProtectedRoute allowedRoles={['student']} role={role} token={token}>
                    <LearningPathPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student']} role={role} token={token}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']} role={role} token={token}>
                    <AdminDashboard token={token} />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </CareerProvider>
    </Router>
  );
}

export default App;
