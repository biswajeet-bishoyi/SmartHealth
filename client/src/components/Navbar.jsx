import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const adminDropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target)) {
        setIsAdminDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsAdminDropdownOpen(false);
  }, [location.pathname]);

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const isAdminActive = ['/simulator', '/resource-planning', '/audit-log', '/risk-config', '/users'].some(
    (p) => location.pathname.startsWith(p)
  );

  return (
    <header className="sticky top-0 z-[9999] w-full bg-[#001e40] text-white border-b border-[#003366] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Sentinel Seal */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#003366] border border-[#799dd6]/40 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <i className="fa-solid fa-shield-halved text-base text-[#6cf8bb]" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight font-headline text-white">
                  SmartHealth<span className="text-[#6cf8bb]">NE</span>
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#003366] text-[#a7c8ff] uppercase tracking-wider font-mono">
                  v2.0
                </span>
              </div>
              <span className="block text-[8.5px] uppercase tracking-widest text-[#a7c8ff] font-semibold">
                NORTHEAST SENTINEL
              </span>
            </div>
          </Link>
        </div>

        {/* Center Primary Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#00142b]/80 p-1 rounded-xl border border-[#003366]/80 backdrop-blur-sm">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isActive('/') && !isActive('/report') && !isActive('/alerts') && !isActive('/queue') && !isActive('/resources') && !isAdminActive
                ? 'bg-[#003366] text-white shadow-sm border border-[#799dd6]/40 font-bold'
                : 'text-[#cbdbf5] hover:text-white hover:bg-[#00244d]'
            }`}
          >
            <i className="fa-solid fa-gauge text-[11px] text-[#6cf8bb]" />
            <span>Overview</span>
          </Link>

          {isAuthenticated && (
            <Link
              to="/report"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isActive('/report')
                  ? 'bg-[#003366] text-white shadow-sm border border-[#799dd6]/40 font-bold'
                  : 'text-[#cbdbf5] hover:text-white hover:bg-[#00244d]'
              }`}
            >
              <i className="fa-solid fa-circle-plus text-[11px] text-cyan-400" />
              <span>Report Incident</span>
            </Link>
          )}

          {user?.role === 'COMMUNITY_MEMBER' && (
            <Link
              to="/community/history"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isActive('/community/history')
                  ? 'bg-[#003366] text-white shadow-sm border border-[#799dd6]/40 font-bold'
                  : 'text-[#cbdbf5] hover:text-white hover:bg-[#00244d]'
              }`}
            >
              <i className="fa-solid fa-route text-[11px] text-amber-400" />
              <span>Track Reports</span>
            </Link>
          )}

          <Link
            to="/alerts"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isActive('/alerts')
                ? 'bg-[#003366] text-white shadow-sm border border-[#799dd6]/40 font-bold'
                : 'text-[#cbdbf5] hover:text-white hover:bg-[#00244d]'
            }`}
          >
            <i className="fa-solid fa-bell text-[11px] text-rose-400" />
            <span>Alerts</span>
          </Link>

          {(user?.role === 'HEALTH_WORKER' || user?.role === 'NATIONAL_ADMIN') && (
            <Link
              to="/queue"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isActive('/queue')
                  ? 'bg-[#003366] text-white shadow-sm border border-[#799dd6]/40 font-bold'
                  : 'text-[#cbdbf5] hover:text-white hover:bg-[#00244d]'
              }`}
            >
              <i className="fa-solid fa-list-check text-[11px] text-emerald-400" />
              <span>Triage Queue</span>
            </Link>
          )}

          <Link
            to="/resources"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isActive('/resources')
                ? 'bg-[#003366] text-white shadow-sm border border-[#799dd6]/40 font-bold'
                : 'text-[#cbdbf5] hover:text-white hover:bg-[#00244d]'
            }`}
          >
            <i className="fa-solid fa-book-medical text-[11px] text-purple-400" />
            <span>Resources</span>
          </Link>

          {/* Admin Suite Dropdown for National Admin */}
          {user?.role === 'NATIONAL_ADMIN' && (
            <div className="relative" ref={adminDropdownRef}>
              <button
                type="button"
                onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isAdminActive
                    ? 'bg-[#003366] text-white shadow-sm border border-[#799dd6]/40'
                    : 'text-[#a7c8ff] hover:text-white hover:bg-[#00244d]'
                }`}
              >
                <i className="fa-solid fa-sliders text-[11px] text-amber-400" />
                <span>Admin Suite</span>
                <i className={`fa-solid fa-chevron-down text-[9px] transition-transform ${isAdminDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isAdminDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#00142b] border border-[#003366] rounded-xl shadow-2xl z-50 p-1.5 space-y-1 animate-fadeIn">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 border-b border-[#00244d]">
                    Administrative Controls
                  </div>
                  <Link
                    to="/simulator"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      isActive('/simulator') ? 'bg-[#003366] text-white font-bold' : 'text-[#cbdbf5] hover:bg-[#00244d] hover:text-white'
                    }`}
                  >
                    <i className="fa-solid fa-flask-vial text-cyan-400 text-xs w-4 text-center" />
                    <span>What-If Simulator</span>
                  </Link>
                  <Link
                    to="/resource-planning"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      isActive('/resource-planning') ? 'bg-[#003366] text-white font-bold' : 'text-[#cbdbf5] hover:bg-[#00244d] hover:text-white'
                    }`}
                  >
                    <i className="fa-solid fa-boxes-stacked text-emerald-400 text-xs w-4 text-center" />
                    <span>Resource Planning</span>
                  </Link>
                  <Link
                    to="/audit-log"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      isActive('/audit-log') ? 'bg-[#003366] text-white font-bold' : 'text-[#cbdbf5] hover:bg-[#00244d] hover:text-white'
                    }`}
                  >
                    <i className="fa-solid fa-clock-rotate-left text-purple-400 text-xs w-4 text-center" />
                    <span>Audit Trail Logs</span>
                  </Link>
                  <Link
                    to="/risk-config"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      isActive('/risk-config') ? 'bg-[#003366] text-white font-bold' : 'text-[#cbdbf5] hover:bg-[#00244d] hover:text-white'
                    }`}
                  >
                    <i className="fa-solid fa-gears text-amber-400 text-xs w-4 text-center" />
                    <span>Risk Formula Config</span>
                  </Link>
                  <Link
                    to="/users"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      isActive('/users') ? 'bg-[#003366] text-white font-bold' : 'text-[#cbdbf5] hover:bg-[#00244d] hover:text-white'
                    }`}
                  >
                    <i className="fa-solid fa-users-gear text-rose-400 text-xs w-4 text-center" />
                    <span>User Management</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Right Action Block */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#cbdbf5] hover:text-white hover:bg-[#003366] border border-[#003366] transition-colors cursor-pointer"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <i className={`fa-solid ${isDark ? 'fa-sun text-amber-300' : 'fa-moon text-blue-200'} text-xs`} />
          </button>

          {/* User Profile / Auth State */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#00142b] border border-[#003366]">
                <div className="w-6 h-6 rounded-full bg-[#003366] text-[#6cf8bb] flex items-center justify-center text-[10px] font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[11px] font-bold text-white max-w-[120px] truncate">
                    {user?.name || 'Officer'}
                  </span>
                  <span className="text-[9px] text-[#6cf8bb] font-semibold">
                    {user?.role === 'NATIONAL_ADMIN' ? 'Admin' : user?.role === 'HEALTH_WORKER' ? 'Health Worker' : 'Community'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-2.5 py-1.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95 flex items-center gap-1 cursor-pointer"
                title="Sign Out"
              >
                <i className="fa-solid fa-arrow-right-from-bracket text-[10px]" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1.5 bg-[#006c49] hover:bg-[#00855a] text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* ─── Mobile Bottom Navigation Bar ──────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#00142b] border-t border-[#003366] shadow-2xl flex justify-around items-center h-14 px-2">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all ${
            isActive('/') && !isActive('/report') && !isActive('/alerts') && !isActive('/queue') && !isActive('/resources') && !isAdminActive
              ? 'text-white bg-[#003366] font-bold'
              : 'text-[#cbdbf5] hover:text-white'
          }`}
        >
          <i className="fa-solid fa-house text-sm" />
          <span className="text-[9px] mt-0.5">Home</span>
        </Link>

        <Link
          to="/report"
          className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all ${
            isActive('/report') ? 'text-white bg-[#003366] font-bold' : 'text-[#cbdbf5] hover:text-white'
          }`}
        >
          <i className="fa-solid fa-circle-plus text-sm" />
          <span className="text-[9px] mt-0.5">Report</span>
        </Link>

        {user?.role === 'COMMUNITY_MEMBER' && (
          <Link
            to="/community/history"
            className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all ${
              isActive('/community/history') ? 'text-white bg-[#003366] font-bold' : 'text-[#cbdbf5] hover:text-white'
            }`}
          >
            <i className="fa-solid fa-route text-sm" />
            <span className="text-[9px] mt-0.5">Track</span>
          </Link>
        )}

        {(user?.role === 'HEALTH_WORKER' || user?.role === 'NATIONAL_ADMIN') && (
          <Link
            to="/queue"
            className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all ${
              isActive('/queue') ? 'text-white bg-[#003366] font-bold' : 'text-[#cbdbf5] hover:text-white'
            }`}
          >
            <i className="fa-solid fa-list-check text-sm" />
            <span className="text-[9px] mt-0.5">Queue</span>
          </Link>
        )}

        <Link
          to="/alerts"
          className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all ${
            isActive('/alerts') ? 'text-white bg-[#003366] font-bold' : 'text-[#cbdbf5] hover:text-white'
          }`}
        >
          <i className="fa-solid fa-bell text-sm" />
          <span className="text-[9px] mt-0.5">Alerts</span>
        </Link>

        {user?.role === 'NATIONAL_ADMIN' ? (
          <Link
            to="/simulator"
            className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all ${
              isAdminActive ? 'text-white bg-[#003366] font-bold' : 'text-[#cbdbf5] hover:text-white'
            }`}
          >
            <i className="fa-solid fa-sliders text-sm" />
            <span className="text-[9px] mt-0.5">Admin</span>
          </Link>
        ) : (
          <Link
            to="/resources"
            className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all ${
              isActive('/resources') ? 'text-white bg-[#003366] font-bold' : 'text-[#cbdbf5] hover:text-white'
            }`}
          >
            <i className="fa-solid fa-book-medical text-sm" />
            <span className="text-[9px] mt-0.5">Guides</span>
          </Link>
        )}
      </nav>
    </header>
  );
}
