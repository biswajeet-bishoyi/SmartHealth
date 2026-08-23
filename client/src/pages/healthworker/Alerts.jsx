import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import api from '../../utils/axiosInstance';
import AlertBanner from '../../components/AlertBanner';

const Alerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New alert form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [riskLevel, setRiskLevel] = useState('HIGH');
  const [village, setVillage] = useState(user?.village || 'Majuli Village');
  const [actionsText, setActionsText] = useState('Boil water before drinking\nAvoid open water sources');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/alerts', { params: { district: user?.district } });
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

  const handleVerifyAlert = async (alertId) => {
    try {
      await api.patch(`/health-worker/alerts/${alertId}/verify`);
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify alert.');
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    try {
      const actions = actionsText.split('\n').filter((a) => a.trim().length > 0);
      await api.post('/health-worker/alerts', {
        title,
        message,
        riskLevel,
        state: user?.state || 'Assam',
        district: user?.district || 'Kamrup',
        village,
        preventionActions: actions,
      });
      setShowCreateModal(false);
      setTitle('');
      setMessage('');
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create alert.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Alert Management & Escalation</h1>
          <p className="page-subtitle">Verify potential alerts or escalate high-risk signals to National Admin for approval</p>
        </div>
        <button className="btn btn-primary text-xs" onClick={() => setShowCreateModal(true)}>
          ➕ Create Potential Alert
        </button>
      </div>

      {loading ? (
        <div className="h-32 skeleton"></div>
      ) : alerts.length === 0 ? (
        <div className="card text-center py-12 text-gray-500 text-sm">No alerts in queue for your district.</div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert._id} className="card p-5 space-y-3">
              <AlertBanner alert={alert} />

              <div className="flex items-center justify-between text-xs bg-gray-50 p-3 rounded-lg border">
                <div>
                  Status:{' '}
                  <span className="font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-200 text-gray-800">
                    {alert.status}
                  </span>
                </div>
                <div>
                  Target: <b>{alert.targetAudience}</b>
                </div>

                {alert.status === 'PENDING_REVIEW' && (
                  <button
                    onClick={() => handleVerifyAlert(alert._id)}
                    className="btn btn-primary text-xs py-1 px-3"
                  >
                    ✓ Verify Alert (Send to Admin)
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Creating Potential Alert */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm">
          <form onSubmit={handleCreateAlert} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Create Potential Alert</h3>

            <div>
              <label className="form-label">Alert Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. HIGH Risk Warning — Majuli Village"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Risk Level</label>
              <select className="form-select" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div>
              <label className="form-label">Target Village</label>
              <input
                type="text"
                className="form-input"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Message Details</label>
              <textarea
                rows={3}
                className="form-input"
                placeholder="Detail the public-health monitoring warning..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Recommended Preventive Actions (One per line)</label>
              <textarea
                rows={3}
                className="form-input"
                value={actionsText}
                onChange={(e) => setActionsText(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn btn-secondary text-xs" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary text-xs">
                Submit Potential Alert
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Alerts;
