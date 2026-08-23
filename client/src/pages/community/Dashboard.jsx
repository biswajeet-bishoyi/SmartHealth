import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useSocket from '../../hooks/useSocket';
import api from '../../utils/axiosInstance';
import VoiceReporter from '../../components/VoiceReporter';
import AlertBanner from '../../components/AlertBanner';

export default function CommunityHome() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const alertsRes = await api.get('/alerts');
        if (alertsRes.data?.success) {
          setAlerts(alertsRes.data.data.alerts || []);
        }
      } catch (err) {
        console.error('Failed to load community alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNewBroadcast = (data) => {
      setAlerts((prev) => [data, ...prev]);
    };
    socket.on('ALERT_BROADCAST', handleNewBroadcast);
    return () => socket.off('ALERT_BROADCAST', handleNewBroadcast);
  }, [socket]);

  const handleVoiceExtracted = (data) => {
    setShowVoiceModal(false);
    if (data?.submittedDirect) {
      return;
    }
    navigate('/report', { state: { voiceData: data } });
  };

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-8 animate-fadeIn">
      {/* Offline Sync Indicator */}
      <div className="bg-[#e5eeff] dark:bg-[#142c4a] text-[#43474f] dark:text-[#a7c8ff] text-xs font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 border border-[#c3c6d1] dark:border-[#1f3c60]">
        <i className="fa-solid fa-cloud-arrow-up text-xs" />
        <span>Connected to Sentinel Network — Live telemetry active for {user?.village || 'Majuli Village'}</span>
      </div>

      {/* Voice Modal if triggered */}
      {showVoiceModal && (
        <VoiceReporter
          onExtractedData={handleVoiceExtracted}
          onCancel={() => setShowVoiceModal(false)}
        />
      )}

      {/* ─── Reporting Section ────────────────────────────────────────── */}
      <section className="space-y-4">
        <h1 className="text-2xl font-extrabold text-[#001e40] dark:text-white font-headline tracking-tight">
          Report an Issue
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/report"
            className="bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-xl p-5 flex items-center gap-3.5 min-h-[64px] active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <i className="fa-solid fa-notes-medical text-2xl" />
            <div>
              <span className="font-bold text-sm font-headline block">Report Symptoms</span>
              <span className="text-[11px] opacity-80">Log acute illness for family</span>
            </div>
          </Link>

          <Link
            to="/report"
            className="bg-[#001e40] hover:bg-[#003366] text-white rounded-xl p-5 flex items-center gap-3.5 min-h-[64px] active:scale-95 transition-all shadow-md cursor-pointer border border-[#003366]"
          >
            <i className="fa-solid fa-droplet text-2xl text-[#6cf8bb]" />
            <div>
              <span className="font-bold text-sm font-headline block">Report Water Issue</span>
              <span className="text-[11px] opacity-80">Flag turbid / dirty well water</span>
            </div>
          </Link>

          <Link
            to="/community/history"
            className="bg-[#003366] hover:bg-[#00488f] text-white rounded-xl p-5 flex items-center gap-3.5 min-h-[64px] active:scale-95 transition-all shadow-md cursor-pointer border border-[#799dd6]/40"
          >
            <i className="fa-solid fa-route text-2xl text-[#a7c8ff]" />
            <div>
              <span className="font-bold text-sm font-headline block">Track My Reports</span>
              <span className="text-[11px] opacity-80">View live triage & verification</span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setShowVoiceModal(true)}
            className="bg-[#006c49] hover:bg-[#00855a] text-white rounded-xl p-5 flex items-center justify-center gap-3.5 min-h-[64px] sm:col-span-2 lg:col-span-3 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <i className="fa-solid fa-microphone-lines text-2xl" />
            <span className="font-bold text-sm font-headline">Report via Voice Assistant (Instant Extraction)</span>
          </button>
        </div>
      </section>

      {/* ─── Active Alerts Section ────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-[#001e40] dark:text-white font-headline tracking-tight">
              Active Public Alerts
            </h2>
            {alerts.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#ba1a1a] text-white animate-pulse">
                {alerts.length} LIVE
              </span>
            )}
          </div>
          <Link to="/alerts" className="text-xs font-bold text-[#003366] dark:text-[#a7c8ff] hover:underline">
            View All ({alerts.length}) →
          </Link>
        </div>

        {loading ? (
          <div className="h-28 skeleton"></div>
        ) : alerts.length === 0 ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 shadow-sm">
            <i className="fa-solid fa-circle-check text-2xl text-emerald-600 dark:text-emerald-400" />
            <div>
              <h4 className="font-bold text-sm">No Active Emergency Alerts in Your Area</h4>
              <p className="text-xs opacity-80 mt-0.5">Water sources and health reports are currently stable. Continue following routine hygiene practices.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 3).map((alert) => (
              <AlertBanner key={alert._id || alert.alertId} alert={alert} />
            ))}
          </div>
        )}
      </section>

      {/* ─── Safety & Awareness Section ──────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#001e40] dark:text-white font-headline tracking-tight">
          Safety & Awareness
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5 flex gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#e5eeff] dark:bg-[#142c4a] text-[#001e40] dark:text-[#a7c8ff] flex items-center justify-center text-xl shrink-0">
              <i className="fa-solid fa-hands-bubbles" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0b1c30] dark:text-white font-headline">
                Hand Washing
              </h3>
              <p className="text-xs text-[#737780] mt-1 leading-relaxed">
                Wash hands thoroughly with soap for 20 seconds before preparing food and after contact with floodwater.
              </p>
            </div>
          </div>

          <div className="card p-5 flex gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#e5eeff] dark:bg-[#142c4a] text-[#001e40] dark:text-[#a7c8ff] flex items-center justify-center text-xl shrink-0">
              <i className="fa-solid fa-glass-water" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0b1c30] dark:text-white font-headline">
                Safe Drinking
              </h3>
              <p className="text-xs text-[#737780] mt-1 leading-relaxed">
                Always boil or filter water from unknown surface ponds or tube-wells near flooded riverbanks.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
