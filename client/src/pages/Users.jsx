import React, { useState, useEffect } from 'react';
import api from '../utils/axiosInstance';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      if (res.data?.success) {
        setUsers(res.data.data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-active`);
      fetchUsers();
    } catch (err) {
      alert('Failed to update user status.');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.village?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 relative pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            View and manage registered system users and role permissions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input text-xs w-48 py-2"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="form-select text-xs w-36 py-2"
          >
            <option value="">All Roles</option>
            <option value="COMMUNITY_MEMBER">Community</option>
            <option value="HEALTH_WORKER">Health Worker</option>
            <option value="NATIONAL_ADMIN">Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card p-6 overflow-x-auto">
        {loading ? (
          <div className="space-y-3">
            <div className="h-12 skeleton" />
            <div className="h-12 skeleton" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-xs">
            No registered users found.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#173b30] text-gray-400 uppercase font-semibold">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#102a22]">
              {filteredUsers.map((userItem) => (
                <tr key={userItem._id} className="hover:bg-gray-50 dark:hover:bg-[#102a22]/50 transition-colors">
                  {/* User Avatar + Name */}
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shadow-sm">
                      {userItem.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white block">
                        {userItem.name}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {userItem.village ? `${userItem.village}, ${userItem.district}` : userItem.district || 'Assam'}
                      </span>
                    </div>
                  </td>

                  {/* Role Pill */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        userItem.role === 'NATIONAL_ADMIN'
                          ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                          : userItem.role === 'HEALTH_WORKER'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      {userItem.role?.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Email */}
                  <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300 font-mono text-[11px]">
                    {userItem.email}
                  </td>

                  {/* Joined Date */}
                  <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <i className="fa-solid fa-calendar text-[11px]" />
                      <span>{userItem.createdAt
                        ? new Date(userItem.createdAt).toLocaleDateString()
                        : 'Jan 2025'}</span>
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleToggleActive(userItem._id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        userItem.isActive !== false
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                      }`}
                    >
                      {userItem.isActive !== false ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Floating Gear Settings Button */}
      <button
        onClick={() => alert('System Settings: Risk Thresholds & Model Parameters are configured.')}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#001e40] hover:bg-[#003366] text-white shadow-xl flex items-center justify-center text-base transition-transform active:scale-95 z-30 cursor-pointer border border-[#003366]"
        title="Settings"
      >
        <i className="fa-solid fa-gear" />
      </button>
    </div>
  );
};

export default Users;
