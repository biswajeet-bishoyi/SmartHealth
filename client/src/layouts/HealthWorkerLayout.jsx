import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LanguageSwitcher from '../components/LanguageSwitcher';

const HealthWorkerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/health-worker/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/health-worker/reports', label: 'Reports Queue', icon: '📥' },
    { to: '/health-worker/villages', label: 'Villages', icon: '🏡' },
    { to: '/health-worker/risk', label: 'Risk Assessment', icon: '⚠️' },
    { to: '/health-worker/alerts', label: 'Alerts', icon: '🚨' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏥</span>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                SmartHealthNE <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded ml-2">Health Worker</span>
              </h1>
              <p className="text-xs text-gray-500">District: {user?.district || 'Kamrup'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-gray-900">{user?.name}</p>
              <p className="text-[10px] text-gray-500">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary text-xs">
              Logout
            </button>
          </div>
        </div>

        {/* Sub-nav bar */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex gap-6 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `py-3 text-xs font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-brand-700 text-brand-700 font-bold'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default HealthWorkerLayout;
