import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { authService } from '../../services/authService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.login({ email, password });
      if (res.success) {
        login(res.data.user, res.data.token);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please verify your officer credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[#f8f9ff] dark:bg-[#061324] transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-[#0c1f36] rounded-2xl shadow-xl p-8 border border-[#e2e8f0] dark:border-[#1f3c60] space-y-6 animate-fadeIn">
        {/* National Sentinel Seal Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-xl bg-[#001e40] text-white flex items-center justify-center text-2xl shadow-md border border-[#003366]">
            <i className="fa-solid fa-shield-halved text-[#6cf8bb]" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#006c49] dark:text-[#6cf8bb] block font-mono">
              INTEGRATED HEALTH SURVEILLANCE
            </span>
            <h1 className="text-2xl font-extrabold text-[#0b1c30] dark:text-white font-headline tracking-tight">
              Officer Portal Sign In
            </h1>
            <p className="text-xs text-[#737780] mt-0.5">
              Access the SmartHealthNE Sentinel Platform
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-[#ffdad6] dark:bg-rose-950/60 border border-[#ba1a1a]/30 text-[#93000a] dark:text-rose-200 text-xs rounded-lg font-bold flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="form-label">OFFICER IDENTIFIER / EMAIL</label>
            <input
              type="email"
              className="form-input text-xs font-semibold"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@smarthealthne.demo"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="form-label">SECURITY CREDENTIAL / PASSWORD</label>
            <input
              type="password"
              className="form-input text-xs font-semibold"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-3.5 text-xs font-black uppercase tracking-wider shadow-md"
          >
            {loading ? 'Authenticating Officer...' : 'Authorize & Sign In →'}
          </button>
        </form>

        {/* Demo Fast Fill Pills */}
        <div className="space-y-2.5 pt-4 border-t border-[#e2e8f0] dark:border-[#1f3c60]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#737780] block text-center">
            Instant Demo Account Quick-Fill
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('admin@smarthealthne.demo', 'Demo@1234')}
              className="px-2.5 py-2 rounded-lg bg-[#e5eeff] dark:bg-[#142c4a] hover:bg-[#d5e3ff] text-[#001e40] dark:text-[#a7c8ff] text-[11px] font-bold transition text-center cursor-pointer border border-[#003366]/20"
            >
              National Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('worker@smarthealthne.demo', 'Demo@1234')}
              className="px-2.5 py-2 rounded-lg bg-[#6cf8bb]/20 dark:bg-emerald-950 hover:bg-[#6cf8bb]/30 text-[#006c49] dark:text-[#6cf8bb] text-[11px] font-bold transition text-center cursor-pointer border border-[#006c49]/20"
            >
              Health Worker
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('community@smarthealthne.demo', 'Demo@1234')}
              className="px-2.5 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 text-[11px] font-bold transition text-center cursor-pointer border border-gray-300 dark:border-gray-700"
            >
              Community
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <p className="text-[11px] text-[#737780]">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#003366] dark:text-[#a7c8ff] font-bold hover:underline">
              Register Community Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
