import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosInstance';
import AlertBanner from '../../components/AlertBanner';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/alerts');
      if (res.data?.success) {
        setAlerts(res.data.data.alerts || []);
      }
    } catch (err) {
      console.error('Error fetching alerts for admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

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
      alert('📢 Alert successfully broadcast to community in real time!');
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || 'Broadcast failed.');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejecting alert:');
    if (!reason) return;
    try {
      await api.patch(`/admin/alerts/${id}/reject`, { reason });
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="text-2xl font-bold text-white">National Alert Approval & Broadcast Pipeline</h1>
        <p className="text-xs text-slate-400">Strict Human Verification: PENDING → VERIFIED → APPROVED → BROADCAST</p>
      </div>

      {loading ? (
        <div className="h-32 skeleton"></div>
      ) : alerts.length === 0 ? (
        <div className="card bg-slate-950 border-slate-800 text-center py-12 text-slate-400 text-sm">
          No alerts in approval queue.
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert._id} className="card bg-slate-950 border-slate-800 p-5 space-y-3">
              <AlertBanner alert={alert} />

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div>
                  Lifecycle Status:{' '}
                  <span className="font-bold uppercase px-2 py-0.5 rounded bg-purple-900 text-purple-200">
                    {alert.status}
                  </span>
                </div>
                <div>Created By: <b>{alert.createdBy?.name || 'Health Worker'}</b></div>

                <div className="flex gap-2">
                  {alert.status === 'VERIFIED' && (
                    <button
                      onClick={() => handleApprove(alert._id)}
                      className="btn btn-primary text-xs py-1.5 px-3"
                    >
                      ✓ Approve Alert
                    </button>
                  )}

                  {alert.status === 'APPROVED' && (
                    <button
                      onClick={() => handleBroadcast(alert._id)}
                      className="btn bg-purple-600 hover:bg-purple-700 text-white text-xs py-1.5 px-3 font-bold"
                    >
                      📢 Broadcast Live to Community
                    </button>
                  )}

                  {['PENDING_REVIEW', 'VERIFIED', 'APPROVED'].includes(alert.status) && (
                    <button
                      onClick={() => handleReject(alert._id)}
                      className="btn btn-danger text-xs py-1.5 px-3"
                    >
                      ✕ Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
