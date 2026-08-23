import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../utils/axiosInstance';
import AlertBanner from '../components/AlertBanner';

const SEVERITY_OPTIONS = [
  { id: 'ADVISORY', label: 'Advisory', iconClass: 'fa-solid fa-circle-info text-blue-500', level: 'LOW' },
  { id: 'WARNING', label: 'Warning', iconClass: 'fa-solid fa-triangle-exclamation text-amber-500', level: 'MEDIUM' },
  { id: 'URGENT', label: 'Urgent', iconClass: 'fa-solid fa-bell text-orange-500', level: 'HIGH' },
  { id: 'CRITICAL', label: 'Critical', iconClass: 'fa-solid fa-fire text-rose-500', level: 'CRITICAL' },
];

const Alerts = () => {
  const { user } = useAuth();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Live Broadcasts'); // 'Live Broadcasts' | 'Pending Review' | 'Pulse Groups'
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // New Broadcast Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState('URGENT');
  const [targetLocation, setTargetLocation] = useState(user?.village || 'Majuli Village, Kamrup');
  const [alertMessage, setAlertMessage] = useState(
    'Elevated gastrointestinal symptoms reported in this area. Boil water before consumption.'
  );
  const [pulseGroup, setPulseGroup] = useState('Kamrup Rapid Response Unit');
  const [emailNotify, setEmailNotify] = useState(true);

  // Confirm Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/alerts');
      if (res.data?.success) {
        setAlerts(res.data.data.alerts || []);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [user]);

  // Action handlers
  const handleOpenConfirm = (e) => {
    e.preventDefault();
    setIsConfirmModalOpen(true);
  };

  const handleExecuteBroadcast = async () => {
    try {
      const riskMapping = {
        ADVISORY: 'LOW',
        WARNING: 'MEDIUM',
        URGENT: 'HIGH',
        CRITICAL: 'CRITICAL',
      };

      const payload = {
        title: `${selectedSeverity} Alert — ${targetLocation}`,
        message: alertMessage,
        riskLevel: riskMapping[selectedSeverity] || 'HIGH',
        state: 'Assam',
        district: user?.district || 'Kamrup',
        village: targetLocation.split(',')[0].trim(),
        preventionActions: [
          'Boil all water before consumption',
          'Avoid untreated surface water sources',
          'Report acute dehydration to health center immediately',
        ],
      };

      if (user?.role === 'HEALTH_WORKER') {
        await api.post('/health-worker/alerts', payload);
      } else if (user?.role === 'NATIONAL_ADMIN') {
        // Create then approve
        const createRes = await api.post('/health-worker/alerts', payload);
        if (createRes.data?.data?.alert?._id) {
          await api.patch(`/admin/alerts/${createRes.data.data.alert._id}/approve`);
          await api.patch(`/admin/alerts/${createRes.data.data.alert._id}/broadcast`);
        }
      }

      setIsConfirmModalOpen(false);
      setIsFormOpen(false);
      alert('✅ Verified! Broadcasting to citizens is sent.');
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || 'Broadcast action failed.');
    }
  };

  const handleVerify = async (id) => {
    try {
      await api.patch(`/health-worker/alerts/${id}/verify`);
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed.');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/admin/alerts/${id}/approve`);
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed.');
    }
  };

  const handleBroadcast = async (id) => {
    try {
      await api.patch(`/admin/alerts/${id}/broadcast`);
      alert('📢 Alert successfully broadcast to community!');
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || 'Broadcast failed.');
    }
  };

  const handleResolve = async (id) => {
    try {
      if (user?.role === 'NATIONAL_ADMIN') {
        await api.patch(`/admin/alerts/${id}/expire`);
      } else {
        await api.patch(`/admin/alerts/${id}/reject`, { reason: 'Resolved by field team' });
      }
      fetchAlerts();
    } catch (err) {
      alert('Action completed.');
      fetchAlerts();
    }
  };

  // Filter alerts
  const pendingCount = alerts.filter((a) => a.status === 'PENDING_REVIEW' || a.status === 'VERIFIED').length;

  const filteredAlerts = alerts.filter((alert) => {
    if (activeTab === 'Live Broadcasts' && alert.status !== 'BROADCAST') return false;
    if (activeTab === 'Pending Review' && alert.status !== 'PENDING_REVIEW' && alert.status !== 'VERIFIED') return false;

    if (filterSeverity === 'Critical' && alert.riskLevel !== 'CRITICAL' && alert.riskLevel !== 'HIGH') return false;
    if (filterSeverity === 'Medium' && alert.riskLevel !== 'MEDIUM') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        alert.title?.toLowerCase().includes(q) ||
        alert.village?.toLowerCase().includes(q) ||
        alert.message?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ─── Hero Banner ────────────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg border border-[#003366] bg-gradient-to-r from-[#001e40] via-[#002d5c] to-[#00142b] text-white p-8 sm:p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#003366] text-[#a7c8ff] border border-[#799dd6]/30 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#6cf8bb] animate-pulse" />
              LIVE SYSTEM STATUS: ONLINE
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-headline">
              Rapid Response <span className="text-[#a7c8ff] block sm:inline">Alert Network</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#cbdbf5] leading-relaxed">
              Real-time epidemiological surveillance and emergency broadcast system for North East India.
            </p>
          </div>

          <div className="flex items-center gap-6 self-start md:self-auto bg-[#00142b] p-4 rounded-xl border border-[#003366]">
            <div className="text-center">
              <div className="text-2xl font-extrabold text-white font-headline">14</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#a7c8ff]">
                Broadcasts
              </div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-extrabold text-white font-headline">8</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#a7c8ff]">
                Groups
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Toolbar Row ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex bg-[#e5eeff] dark:bg-[#142c4a] p-1 rounded-xl border border-[#c3c6d1] dark:border-[#1f3c60] text-xs font-bold">
          {['Live Broadcasts', 'Pending Review', 'Pulse Groups'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-4 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#001e40] text-white shadow-sm font-bold'
                    : 'text-[#43474f] dark:text-[#c3c6d1] hover:text-[#0b1c30] dark:hover:text-white'
                }`}
              >
                <span>{tab}</span>
                {tab === 'Pending Review' && pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#ba1a1a] text-white font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search, Filter chips & Broadcast toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input text-xs w-48 py-2"
          />

          <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#0b1f1a] p-1 rounded-xl border border-gray-200 dark:border-[#173b30] text-xs font-semibold">
            {['All', 'Critical', 'Medium'].map((chip) => (
              <button
                key={chip}
                onClick={() => setFilterSeverity(chip)}
                className={`py-1.5 px-3 rounded-lg text-xs transition-all ${
                  filterSeverity === chip
                    ? 'bg-white dark:bg-[#173b30] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className={`btn text-xs py-2 px-4 font-bold ${
              isFormOpen
                ? 'btn-danger'
                : 'btn-primary'
            }`}
          >
            {isFormOpen ? '✕ Cancel Operation' : '+ New Broadcast'}
          </button>
        </div>
      </div>

      {/* ─── Inline Broadcast Center Form ────────────────────────────────────── */}
      {isFormOpen && (
        <form onSubmit={handleOpenConfirm} className="card p-6 space-y-6 border-2 border-emerald-500/40 bg-emerald-50/20 dark:bg-[#0b1f1a] animate-in fade-in slide-in-from-top-4 duration-200">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Broadcast Center
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Initialize a new alert aimed at specific zones. Ensure all details, specifically the urgency level, are verified before submission.
            </p>
          </div>

          {/* 4 Severity Tabs */}
          <div>
            <label className="form-label">Urgency & Severity Level</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SEVERITY_OPTIONS.map((opt) => {
                const isSelected = selectedSeverity === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedSeverity(opt.id)}
                    className={`p-3 rounded-xl border-2 text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#001e40] bg-[#e5eeff] dark:bg-[#142c4a] text-[#001e40] dark:text-[#a7c8ff] font-bold shadow-sm'
                        : 'border-[#c3c6d1] dark:border-[#1f3c60] bg-white dark:bg-[#0c1f36] text-[#0b1c30] dark:text-[#eaf1ff]'
                    }`}
                  >
                    <i className={`${opt.iconClass} text-base`} />
                    <span className="text-xs">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location & Message */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Target Location / Village Sector</label>
              <input
                type="text"
                className="form-input text-xs"
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Target Pulse Group</label>
              <input
                type="text"
                className="form-input text-xs"
                value={pulseGroup}
                onChange={(e) => setPulseGroup(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Public Health Broadcast Message</label>
            <textarea
              rows={3}
              className="form-input text-xs"
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
              required
            />
          </div>

          <div className="p-3 bg-[#eff4ff] dark:bg-[#142c4a] rounded-xl text-xs text-[#001e40] dark:text-[#a7c8ff] flex items-center gap-2 border border-[#003366]/20">
            <i className="fa-solid fa-shield-halved text-[#6cf8bb]" />
            <span>Admin approval & authorization required before public citizen broadcast.</span>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[#e2e8f0] dark:border-[#1f3c60]">
            <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary text-xs py-2.5 px-6 font-bold">
              <i className="fa-solid fa-bullhorn" />
              <span>Initialize Broadcast</span>
            </button>
          </div>
        </form>
      )}

      {/* ─── Confirm Broadcast Modal ────────────────────────────────────────── */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="card max-w-md w-full p-6 space-y-5 shadow-2xl border-2 border-[#003366]">
            <h3 className="text-lg font-bold text-[#0b1c30] dark:text-white font-headline">
              Confirm Broadcast
            </h3>
            <p className="text-xs text-[#737780]">
              Are you sure you want to broadcast this urgent public-health alert to <b>{targetLocation}</b>?
            </p>

            <div className="p-3.5 bg-[#f8f9ff] dark:bg-[#061324] rounded-xl border border-[#e2e8f0] dark:border-[#1f3c60] text-xs space-y-2">
              <div>Urgency: <b className="text-[#ba1a1a]">{selectedSeverity}</b></div>
              <div>Target Pulse Group: <b>{pulseGroup}</b></div>
              <div className="text-[#737780] italic">"{alertMessage}"</div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotify}
                onChange={(e) => setEmailNotify(e.target.checked)}
                className="w-4 h-4 text-[#003366] rounded"
              />
              <span>Notify registered users in target zone (SMS / WhatsApp)</span>
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBroadcast}
                className="btn btn-primary text-xs py-2.5 px-5 font-bold shadow-md"
              >
                <i className="fa-solid fa-paper-plane" />
                <span>Broadcast Alert Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Alerts Feed / Cards List ─────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-28 skeleton" />
          <div className="h-28 skeleton" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="card text-center py-16 text-[#737780] text-sm">
          No alerts found in <b>{activeTab}</b>.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div
              key={alert._id}
              className="card p-6 space-y-4 border-l-4 border-l-[#001e40] hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#e5eeff] dark:bg-[#142c4a] text-[#001e40] dark:text-[#a7c8ff] flex items-center justify-center text-base shrink-0">
                    <i className={alert.riskLevel === 'CRITICAL' || alert.riskLevel === 'HIGH' ? 'fa-solid fa-triangle-exclamation text-[#ba1a1a]' : 'fa-solid fa-circle-info text-[#003366] dark:text-[#a7c8ff]'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-[#0b1c30] dark:text-white font-headline">
                        {alert.village || alert.district}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ffdad6] text-[#93000a] uppercase">
                        {alert.riskLevel} PRIORITY
                      </span>
                    </div>
                    <span className="text-[11px] text-[#737780]">
                      {new Date(alert.createdAt).toLocaleDateString()} • {alert.state || 'Assam'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#e5eeff] dark:bg-[#142c4a] text-[#001e40] dark:text-[#a7c8ff] font-mono">
                    {alert.status}
                  </span>

                  {/* Health Worker verification */}
                  {user?.role === 'HEALTH_WORKER' && alert.status === 'PENDING_REVIEW' && (
                    <button
                      onClick={() => handleVerify(alert._id)}
                      className="btn btn-primary text-xs py-1.5 px-3"
                    >
                      <i className="fa-solid fa-check" /> Verify
                    </button>
                  )}

                  {/* Admin Approve & Broadcast */}
                  {user?.role === 'NATIONAL_ADMIN' && alert.status === 'PENDING_REVIEW' && (
                    <button
                      onClick={() => handleApprove(alert._id)}
                      className="btn btn-primary text-xs py-1.5 px-3"
                    >
                      ✓ Approve
                    </button>
                  )}

                  {user?.role === 'NATIONAL_ADMIN' && alert.status === 'APPROVED' && (
                    <button
                      onClick={() => handleBroadcast(alert._id)}
                      className="btn bg-purple-600 hover:bg-purple-500 text-white text-xs py-1.5 px-3 font-bold"
                    >
                      📢 Broadcast
                    </button>
                  )}

                  <button
                    onClick={() => handleResolve(alert._id)}
                    className="btn btn-secondary text-xs py-1.5 px-3"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                {alert.message}
              </p>

              {alert.preventionActions && alert.preventionActions.length > 0 && (
                <div className="text-xs bg-gray-50 dark:bg-[#071613] p-3 rounded-xl border border-gray-100 dark:border-[#173b30]">
                  <span className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Recommended Preventive Actions:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-gray-600 dark:text-gray-400">
                    {alert.preventionActions.map((action, idx) => (
                      <li key={idx}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
