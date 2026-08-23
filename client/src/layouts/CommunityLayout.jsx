import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useOfflineSync } from '../hooks/useOfflineSync';
import LanguageSwitcher from '../components/LanguageSwitcher';

const CommunityLayout = () => {
  const { user, logout } = useAuth();
  const { isOnline, pendingCount } = useOfflineSync();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/community/dashboard', label: 'Home', icon: '🏠' },
    { to: '/community/report', label: 'Report', icon: '📋' },
    { to: '/community/alerts', label: 'Alerts', icon: '🚨' },
    { to: '/community/awareness', label: 'Learn', icon: '📚' },
    { to: '/community/history', label: 'History', icon: '📜' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20 md:pb-0">
      {/* Offline notification banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs text-center py-1.5 px-4 font-semibold flex items-center justify-center gap-2">
          <span>⚠️ You are offline. Reports will save locally and sync when connected.</span>
          {pendingCount > 0 && (
            <span className="bg-amber-800 px-2 py-0.5 rounded-full text-[10px]">
              {pendingCount} Pending
            </span>
          )}
        </div>
      )}

      {/* Header */}
      <header className="bg-brand-700 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <div>
              <h1 className="text-lg font-bold leading-tight">SmartHealthNE</h1>
              <p className="text-[10px] opacity-80">Community Health Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher className="hidden sm:flex" />
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold">{user?.name}</p>
              <p className="text-[10px] opacity-75">{user?.village || 'Community'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs bg-brand-800 hover:bg-brand-900 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4">
        <div className="sm:hidden mb-3">
          <LanguageSwitcher />
        </div>
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center text-xs font-medium transition-colors ${
                  isActive ? 'text-brand-700 font-bold' : 'text-gray-500 hover:text-gray-900'
                }`
              }
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CommunityLayout;
