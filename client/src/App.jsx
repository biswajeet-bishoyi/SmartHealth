import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import useAuth from './hooks/useAuth';

// Layout
import AppLayout from './layouts/AppLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Core Pages
import Dashboard from './pages/Dashboard';
import Report from './pages/Report';
import Alerts from './pages/Alerts';
import Resources from './pages/Resources';
import Users from './pages/Users';
import HealthWorkerQueue from './pages/HealthWorkerQueue';

// v2.0 Admin Pages
import WhatIfSimulator from './pages/admin/WhatIfSimulator';
import ResourcePlanning from './pages/admin/ResourcePlanning';
import AuditLog from './pages/admin/AuditLog';
import RiskConfigPage from './pages/admin/RiskConfig';

// Protected Route Guard
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8faf9] dark:bg-[#081714]">
        <div className="text-center">
          <span className="text-4xl animate-bounce block mb-2">🌱</span>
          <p className="text-xs font-bold text-gray-600 dark:text-gray-300">Loading SmartHealthNE...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/register" element={<Signup />} />

      {/* Main Shell with Sticky Navbar and 3-Column Footer */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/report"
          element={
            <ProtectedRoute allowedRoles={['COMMUNITY_MEMBER', 'HEALTH_WORKER', 'NATIONAL_ADMIN']}>
              <Report />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute allowedRoles={['COMMUNITY_MEMBER', 'HEALTH_WORKER', 'NATIONAL_ADMIN']}>
              <Alerts />
            </ProtectedRoute>
          }
        />
        <Route path="/resources" element={<Resources />} />
        <Route path="/awareness" element={<Resources />} />
        <Route
          path="/queue"
          element={
            <ProtectedRoute allowedRoles={['HEALTH_WORKER', 'NATIONAL_ADMIN']}>
              <HealthWorkerQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/health-worker/queue"
          element={
            <ProtectedRoute allowedRoles={['HEALTH_WORKER', 'NATIONAL_ADMIN']}>
              <HealthWorkerQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['NATIONAL_ADMIN']}>
              <Users />
            </ProtectedRoute>
          }
        />

        {/* v2.0 Admin Routes */}
        <Route
          path="/simulator"
          element={
            <ProtectedRoute allowedRoles={['NATIONAL_ADMIN']}>
              <WhatIfSimulator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resource-planning"
          element={
            <ProtectedRoute allowedRoles={['NATIONAL_ADMIN']}>
              <ResourcePlanning />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-log"
          element={
            <ProtectedRoute allowedRoles={['NATIONAL_ADMIN']}>
              <AuditLog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/risk-config"
          element={
            <ProtectedRoute allowedRoles={['NATIONAL_ADMIN']}>
              <RiskConfigPage />
            </ProtectedRoute>
          }
        />

        {/* Legacy redirects */}
        <Route path="/community/*" element={<Navigate to="/" replace />} />
        <Route path="/health-worker/*" element={<Navigate to="/" replace />} />
        <Route path="/admin/users" element={<Navigate to="/users" replace />} />
        <Route path="/admin/simulator" element={<Navigate to="/simulator" replace />} />
        <Route path="/admin/resources" element={<Navigate to="/resource-planning" replace />} />
        <Route path="/admin/audit" element={<Navigate to="/audit-log" replace />} />
        <Route path="/admin/config" element={<Navigate to="/risk-config" replace />} />
        <Route path="/admin/*" element={<Navigate to="/" replace />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
