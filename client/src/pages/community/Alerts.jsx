import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import useSocket from '../../hooks/useSocket';
import { alertService } from '../../services/alertService';
import AlertBanner from '../../components/AlertBanner';

const Alerts = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await alertService.getAlerts({
        district: user?.district,
        status: 'BROADCAST',
      });
      if (res.success) {
        setAlerts(res.data.alerts || []);
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

  // Real-time listener for incoming broadcast alerts
  useEffect(() => {
    if (!socket) return;
    const handleBroadcast = (newAlert) => {
      setAlerts((prev) => [newAlert, ...prev]);
    };
    socket.on('ALERT_BROADCAST', handleBroadcast);
    return () => socket.off('ALERT_BROADCAST', handleBroadcast);
  }, [socket]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Community Health Alerts</h1>
        <p className="page-subtitle">Verified warnings broadcast by public health administrators for {user?.district || 'your region'}</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-32 skeleton"></div>
          <div className="h-32 skeleton"></div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl">✅</span>
          <h3 className="text-lg font-bold text-gray-900 mt-2">No Active Health Alerts</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            There are currently no official warning broadcasts for your area. Keep practicing good hygiene and safe water habits!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <AlertBanner key={alert._id || alert.alertId} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
