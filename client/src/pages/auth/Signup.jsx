import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { NORTHEAST_STATES, getDistricts, getVillages } from '../../data/locationData';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('COMMUNITY_MEMBER');
  const [stateRegion, setStateRegion] = useState('Assam');
  const [district, setDistrict] = useState('Kamrup');
  const [village, setVillage] = useState('Majuli Village');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const availableDistricts = useMemo(() => getDistricts(stateRegion), [stateRegion]);
  const districtOptions = useMemo(() => {
    const list = [...availableDistricts];
    if (district && !list.includes(district)) list.unshift(district);
    return list;
  }, [availableDistricts, district]);

  const availableVillages = useMemo(() => getVillages(stateRegion, district), [stateRegion, district]);
  const villageOptions = useMemo(() => {
    const list = [...availableVillages];
    if (village && !list.includes(village)) list.unshift(village);
    return list;
  }, [availableVillages, village]);

  const handleStateChange = (e) => {
    const newState = e.target.value;
    setStateRegion(newState);
    const newDistricts = getDistricts(newState);
    const nextDistrict = newDistricts.length > 0 ? newDistricts[0] : '';
    setDistrict(nextDistrict);
    const newVillages = getVillages(newState, nextDistrict);
    const nextVillage = newVillages.length > 0 ? newVillages[0] : '';
    setVillage(nextVillage);
  };

  const handleDistrictChange = (e) => {
    const newDistrict = e.target.value;
    setDistrict(newDistrict);
    const newVillages = getVillages(stateRegion, newDistrict);
    const nextVillage = newVillages.length > 0 ? newVillages[0] : '';
    setVillage(nextVillage);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.register({
        name,
        email,
        password,
        role,
        state: stateRegion,
        district,
        village,
        language: 'en',
      });
      if (res.success) {
        login(res.data.user, res.data.token);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8f9ff] dark:bg-[#061324] transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-[#0c1f36] rounded-2xl shadow-xl p-8 border border-[#e2e8f0] dark:border-[#1f3c60] space-y-6 animate-fadeIn">
        {/* National Sentinel Seal Header */}
        <div className="flex justify-center items-center gap-2 pt-2">
          <div className="w-12 h-12 rounded-xl bg-[#001e40] text-white flex items-center justify-center text-xl shadow-md border border-[#003366]">
            <i className="fa-solid fa-shield-halved text-[#6cf8bb]" />
          </div>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-extrabold text-[#0b1c30] dark:text-white font-headline tracking-tight">
            Create Account
          </h1>
          <p className="text-xs text-[#737780]">
            Join the SmartHealthNE Sentinel Surveillance Network
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-[#ffdad6] dark:bg-rose-950/60 border border-[#ba1a1a]/30 text-[#93000a] dark:text-rose-200 text-xs rounded-lg font-bold flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">FULL NAME</label>
            <input
              type="text"
              className="form-input text-xs font-semibold"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ranjit Das"
              required
            />
          </div>

          <div>
            <label className="form-label">EMAIL</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#737780] text-xs pointer-events-none">
                <i className="fa-solid fa-envelope" />
              </span>
              <input
                type="email"
                className="form-input pl-10 text-xs font-semibold"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@smarthealthne.demo"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">PASSWORD</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#737780] text-xs pointer-events-none">
                <i className="fa-solid fa-lock" />
              </span>
              <input
                type="password"
                className="form-input pl-10 text-xs font-semibold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="form-label">ACCOUNT ROLE</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('COMMUNITY_MEMBER')}
                className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  role === 'COMMUNITY_MEMBER'
                    ? 'border-[#001e40] bg-[#e5eeff] dark:bg-[#142c4a] text-[#001e40] dark:text-[#a7c8ff] ring-2 ring-[#003366]/20'
                    : 'border-[#c3c6d1] dark:border-[#1f3c60] text-[#0b1c30] dark:text-[#eaf1ff]'
                }`}
              >
                <i className="fa-solid fa-users" />
                <span>Community</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('HEALTH_WORKER')}
                className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  role === 'HEALTH_WORKER'
                    ? 'border-[#006c49] bg-[#6cf8bb]/20 dark:bg-emerald-950 text-[#006c49] dark:text-[#6cf8bb] ring-2 ring-[#006c49]/20'
                    : 'border-[#c3c6d1] dark:border-[#1f3c60] text-[#0b1c30] dark:text-[#eaf1ff]'
                }`}
              >
                <i className="fa-solid fa-stethoscope" />
                <span>Health Worker</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="form-label">STATE</label>
              <select
                className="form-select text-xs font-semibold"
                value={stateRegion}
                onChange={handleStateChange}
              >
                {NORTHEAST_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">DISTRICT</label>
              <select
                className="form-select text-xs font-semibold"
                value={district}
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
              <label className="form-label">VILLAGE</label>
              <select
                className="form-select text-xs font-semibold"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-3.5 text-xs font-black uppercase tracking-wider shadow-md active:scale-95"
          >
            {loading ? 'Creating Account...' : 'Register Account →'}
          </button>
        </form>

        <div className="text-center text-xs text-[#737780]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#003366] dark:text-[#a7c8ff] font-bold hover:underline">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
