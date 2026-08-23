import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosInstance';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter) params.role = roleFilter;

      const res = await api.get('/admin/users', { params });
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
  }, [roleFilter]);

  const toggleUserActive = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-active`);
      fetchUsers();
    } catch (err) {
      alert('Failed to toggle user state.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-xs text-slate-400">Control system access for Community Members, Health Workers, and Admins</p>
        </div>

        <select
          className="form-select bg-slate-800 text-white border-slate-700 text-xs w-48"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="COMMUNITY_MEMBER">Community Member</option>
          <option value="HEALTH_WORKER">Health Worker</option>
          <option value="NATIONAL_ADMIN">National Admin</option>
        </select>
      </div>

      <div className="card bg-slate-950 border-slate-800 overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 font-semibold uppercase">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Location</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-slate-900">
                <td className="p-3 font-bold text-white">{user.name}</td>
                <td className="p-3 font-mono text-slate-400">{user.email}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      user.role === 'NATIONAL_ADMIN'
                        ? 'bg-purple-900 text-purple-200'
                        : user.role === 'HEALTH_WORKER'
                        ? 'bg-blue-900 text-blue-200'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="p-3">{user.village}, {user.district}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.isActive ? 'bg-emerald-900 text-emerald-200' : 'bg-red-900 text-red-200'}`}>
                    {user.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => toggleUserActive(user._id)}
                    className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-[10px] rounded text-slate-200 font-semibold"
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
