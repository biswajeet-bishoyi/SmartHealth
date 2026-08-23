import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useSocket from '../../hooks/useSocket';
import api from '../../utils/axiosInstance';
import VoiceReporter from '../../components/VoiceReporter';

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/report"
            className="bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-xl p-5 flex items-center gap-3.5 min-h-[64px] active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <i className="fa-solid fa-notes-medical text-2xl" />
            <span className="font-bold text-sm font-headline">Report Health Issue</span>
          </Link>

          <Link
            to="/report"
            className="bg-[#001e40] hover:bg-[#003366] text-white rounded-xl p-5 flex items-center gap-3.5 min-h-[64px] active:scale-95 transition-all shadow-md cursor-pointer border border-[#003366]"
          >
            <i className="fa-solid fa-droplet text-2xl text-[#6cf8bb]" />
            <span className="font-bold text-sm font-headline">Report Water Problem</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowVoiceModal(true)}
            className="bg-[#006c49] hover:bg-[#00855a] text-white rounded-xl p-5 flex items-center justify-center gap-3.5 min-h-[64px] md:col-span-2 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <i className="fa-solid fa-microphone-lines text-2xl" />
            <span className="font-bold text-sm font-headline">Report by Voice</span>
          </button>
        </div>
      </section>

      {/* ─── Active Alerts Section ────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#001e40] dark:text-white font-headline tracking-tight">
            Active Alerts
          </h2>
          <Link to="/alerts" className="text-xs font-bold text-[#003366] dark:text-[#a7c8ff] hover:underline">
            View All ({alerts.length})
          </Link>
        </div>

        {/* Water Safety Advisory Banner */}
        <div className="bg-[#ffdad6] dark:bg-rose-950/40 text-[#93000a] dark:text-rose-200 rounded-2xl p-6 border border-[#ba1a1a]/30 flex flex-col gap-3 shadow-md relative overflow-hidden">
          <div className="absolute -right-6 -top-6 opacity-10 pointer-events-none">
            <i className="fa-solid fa-triangle-exclamation text-9xl" />
          </div>

          <div className="flex items-center gap-2.5 z-10">
            <i className="fa-solid fa-triangle-exclamation text-lg text-[#ba1a1a]" />
            <h3 className="text-base font-extrabold font-headline">
              Water Safety Advisory
            </h3>
          </div>

          <p className="text-xs font-medium z-10 leading-relaxed max-w-xl">
            Boil water for at least 1 minute before consumption in Sector 4 & Majuli Village due to reported turbidity and upstream flood surge.
          </p>

          <div className="flex justify-end z-10 pt-1">
            <Link
              to="/alerts"
              className="text-xs font-bold text-[#ba1a1a] dark:text-rose-300 hover:underline px-3 py-1.5 rounded-lg hover:bg-[#ba1a1a]/10 transition-colors"
            >
              View Full Advisory Details →
            </Link>
          </div>
        </div>
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
