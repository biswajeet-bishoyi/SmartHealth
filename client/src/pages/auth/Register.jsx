import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { NORTHEAST_STATES, getDistricts, getVillages } from '../../data/locationData';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'COMMUNITY_MEMBER',
    state: 'Assam',
    district: 'Kamrup',
    village: 'Majuli Village',
    language: 'en',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const availableDistricts = useMemo(() => getDistricts(formData.state), [formData.state]);
  const districtOptions = useMemo(() => {
    const list = [...availableDistricts];
    if (formData.district && !list.includes(formData.district)) list.unshift(formData.district);
    return list;
  }, [availableDistricts, formData.district]);

  const availableVillages = useMemo(() => getVillages(formData.state, formData.district), [formData.state, formData.district]);
  const villageOptions = useMemo(() => {
    const list = [...availableVillages];
    if (formData.village && !list.includes(formData.village)) list.unshift(formData.village);
    return list;
  }, [availableVillages, formData.village]);

  const handleStateChange = (e) => {
    const newState = e.target.value;
    const newDistricts = getDistricts(newState);
    const nextDistrict = newDistricts.length > 0 ? newDistricts[0] : '';
    const newVillages = getVillages(newState, nextDistrict);
    const nextVillage = newVillages.length > 0 ? newVillages[0] : '';
    setFormData({
      ...formData,
      state: newState,
      district: nextDistrict,
      village: nextVillage,
    });
  };

  const handleDistrictChange = (e) => {
    const newDistrict = e.target.value;
    const newVillages = getVillages(formData.state, newDistrict);
    const nextVillage = newVillages.length > 0 ? newVillages[0] : '';
    setFormData({
      ...formData,
      district: newDistrict,
      village: nextVillage,
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.register(formData);
      if (res.success) {
        login(res.data.user, res.data.token);
        const role = res.data.user.role;
        if (role === 'NATIONAL_ADMIN') navigate('/admin/dashboard');
        else if (role === 'HEALTH_WORKER') navigate('/health-worker/dashboard');
        else navigate('/community/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 flex items-center justify-center p-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-3xl">🌱</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create Account</h1>
            <p className="text-xs text-gray-500">Join the SmartHealthNE Community Network</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Ranjit Das"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="form-label">Account Role</label>
            <select name="role" className="form-select" value={formData.role} onChange={handleChange}>
              <option value="COMMUNITY_MEMBER">Community Member (Resident)</option>
              <option value="HEALTH_WORKER">Health Worker (Local Staff)</option>
              <option value="NATIONAL_ADMIN">National Admin (Public Health)</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label">State</label>
              <select name="state" className="form-select" value={formData.state} onChange={handleStateChange}>
                {NORTHEAST_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">District</label>
              <select
                name="district"
                className="form-select"
                value={formData.district}
                onChange={handleDistrictChange}
                required
              >
                {districtOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Village</label>
              <select
                name="village"
                className="form-select"
                value={formData.village}
                onChange={handleChange}
                required
              >
                {villageOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full py-3 mt-4" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-700 font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
