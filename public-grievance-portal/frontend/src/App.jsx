import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import CitizenDashboard from './pages/CitizenDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const stored = localStorage.getItem('grievance_user');
  const user = stored ? JSON.parse(stored)?.user : null;

  return (
    <BrowserRouter>
      <div className="app-root">
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Default Landing Route */}
            <Route
              path="/"
              element={
                user ? (
                  <Navigate
                    to={user.role === 'admin' || user.role === 'superadmin' ? '/admin' : '/dashboard'}
                    replace
                  />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Citizen Protected Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['citizen']}>
                  <CitizenDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin & SuperAdmin Protected Dashboard */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback 404 Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
