import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { authService } from '../../services/authService';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    village: user?.village || '',
    district: user?.district || '',
    state: user?.state || 'Assam',
    language: user?.language || 'en',
  });
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authService.updateProfile(formData);
      if (res.success) {
        updateUser(res.data.user);
        setMsg('Profile updated successfully!');
      }
    } catch {
      setMsg('Failed to update profile.');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="page-header">
        <h1 className="page-title">User Profile</h1>
        <p className="page-subtitle">Manage your account details and preferred language</p>
      </div>

      {msg && <div className="p-3 bg-brand-50 text-brand-800 border border-brand-200 text-xs font-bold rounded-lg">{msg}</div>}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="form-label">Full Name</label>
          <input
            type="text"
            className="form-input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="form-label">Email (Read Only)</label>
          <input type="text" className="form-input bg-gray-100 text-gray-500" value={user?.email} disabled />
        </div>

        <div>
          <label className="form-label">Phone Number</label>
          <input
            type="tel"
            className="form-input"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">District</label>
            <input
              type="text"
              className="form-input"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Village</label>
            <input
              type="text"
              className="form-input"
              value={formData.village}
              onChange={(e) => setFormData({ ...formData, village: e.target.value })}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full py-3">
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default Profile;
