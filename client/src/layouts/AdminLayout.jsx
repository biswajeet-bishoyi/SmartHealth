import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LanguageSwitcher from '../components/LanguageSwitcher';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: '🏛️' },
    { to: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { to: '/admin/users', label: 'Users', icon: '👥' },
    { to: '/admin/alerts', label: 'Alert Approval', icon: '🚨' },
    { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇮🇳</span>
            <div>
              <h1 className="text-base font-bold leading-tight">SmartHealthNE</h1>
              <span className="text-[10px] bg-purple-900 text-purple-200 font-semibold px-2 py-0.5 rounded">
                National Admin
              </span>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="mb-3">
            <p className="text-xs font-semibold text-slate-200">{user?.name}</p>
            <p className="text-[10px] text-slate-400">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors text-slate-200"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
        {/* Top Header */}
        <header className="bg-slate-950 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">
            Northeast India Public-Health Command Center
          </h2>
          <LanguageSwitcher />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 text-slate-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
