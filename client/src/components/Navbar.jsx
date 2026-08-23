import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = isAuthenticated
    ? [
        { name: 'Command Overview', path: '/' },
        { name: 'Report Incident', path: '/report' },
        { name: 'Alerts & Broadcasts', path: '/alerts' },
        ...(user?.role === 'HEALTH_WORKER' || user?.role === 'NATIONAL_ADMIN'
          ? [{ name: 'Triage Queue', path: '/queue' }]
          : []),
        { name: 'Public Resources', path: '/resources' },
        ...(user?.role === 'NATIONAL_ADMIN'
          ? [
              { name: 'Simulator', path: '/simulator' },
              { name: 'Resource Planning', path: '/resource-planning' },
              { name: 'Audit Trail', path: '/audit-log' },
              { name: 'Risk Config', path: '/risk-config' },
              { name: 'Users', path: '/users' },
            ]
          : []),
      ]
    : [
        { name: 'Command Overview', path: '/' },
        { name: 'Public Resources', path: '/resources' },
      ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-[9999] w-full bg-[#001e40] text-white border-b border-[#003366] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & National Seal */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-[#003366] border border-[#799dd6]/30 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <i className="fa-solid fa-shield-halved text-lg text-[#6cf8bb]" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight font-headline text-white">
                  SmartHealth<span className="text-[#6cf8bb]">NE</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#003366] text-[#799dd6] uppercase tracking-wider font-mono">
                  v2.0
                </span>
              </div>
              <span className="block text-[9px] uppercase tracking-widest text-[#a7c8ff] font-semibold">
                NORTHEAST SENTINEL SYSTEM
              </span>
            </div>
          </Link>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#00142b] p-1 rounded-lg border border-[#003366]/60">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#003366] text-white shadow-sm border border-[#799dd6]/30 font-bold'
                    : 'text-[#cbdbf5] hover:text-white hover:bg-[#00244d]'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Block */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#cbdbf5] hover:text-white hover:bg-[#003366] border border-[#003366] transition-colors cursor-pointer"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <i className={`fa-solid ${isDark ? 'fa-sun text-amber-300' : 'fa-moon text-blue-200'}`} />
          </button>

          {/* User Profile / Auth State */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-white leading-tight">
                  {user?.name || 'Authorized Officer'}
                </span>
                <span className="text-[10px] text-[#6cf8bb] font-semibold">
                  {user?.role?.replace(/_/g, ' ')}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-[#006c49] hover:bg-[#00855a] text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* ─── Stitch Mobile Bottom Navigation Bar ──────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#00142b] border-t border-[#003366] shadow-xl flex justify-around items-center h-16 px-4">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
            isActive('/') && !isActive('/report') && !isActive('/alerts') && !isActive('/queue') && !isActive('/resources')
              ? 'text-white bg-[#003366] font-bold'
              : 'text-[#cbdbf5] hover:text-white'
          }`}
        >
          <i className="fa-solid fa-house text-base" />
          <span className="text-[10px] mt-0.5">Home</span>
        </Link>

        <Link
          to="/report"
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
            isActive('/report')
              ? 'text-white bg-[#003366] font-bold'
              : 'text-[#cbdbf5] hover:text-white'
          }`}
        >
          <i className="fa-solid fa-circle-plus text-base" />
          <span className="text-[10px] mt-0.5">Report</span>
        </Link>

        {user?.role === 'HEALTH_WORKER' || user?.role === 'NATIONAL_ADMIN' ? (
          <Link
            to="/queue"
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
              isActive('/queue')
                ? 'text-white bg-[#003366] font-bold'
                : 'text-[#cbdbf5] hover:text-white'
            }`}
          >
            <i className="fa-solid fa-list-check text-base" />
            <span className="text-[10px] mt-0.5">Queue</span>
          </Link>
        ) : (
          <Link
            to="/resources"
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
              isActive('/resources')
                ? 'text-white bg-[#003366] font-bold'
                : 'text-[#cbdbf5] hover:text-white'
            }`}
          >
            <i className="fa-solid fa-book-medical text-base" />
            <span className="text-[10px] mt-0.5">Guides</span>
          </Link>
        )}

        <Link
          to="/alerts"
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
            isActive('/alerts')
              ? 'text-white bg-[#003366] font-bold'
              : 'text-[#cbdbf5] hover:text-white'
          }`}
        >
          <i className="fa-solid fa-bell text-base" />
          <span className="text-[10px] mt-0.5">Alerts</span>
        </Link>
      </nav>
    </header>
  );
}
