import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosInstance';
import StatCard from '../../components/StatCard';
import RiskMap from '../../components/RiskMap';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalReports: 0,
    totalUsers: 0,
    activeAlerts: 0,
    broadcastAlerts: 0,
    highRiskVillages: 0,
  });
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashRes, riskRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/risk'),
        ]);

        if (dashRes.data?.success) setStats(dashRes.data.data);
        if (riskRes.data?.success) setAssessments(riskRes.data.data.assessments || []);
      } catch (err) {
        console.error('Error fetching admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Northeast India Command Overview</h1>
          <p className="text-xs text-slate-400">Cross-state public health monitoring & emergency broadcast authorization</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Reports" value={stats.totalReports} icon="📋" color="blue" loading={loading} />
        <StatCard title="Registered Users" value={stats.totalUsers} icon="👥" color="brand" loading={loading} />
        <StatCard title="Alerts in Pipeline" value={stats.activeAlerts} icon="⏳" color="yellow" loading={loading} />
        <StatCard title="Live Broadcasts" value={stats.broadcastAlerts} icon="📢" color="purple" loading={loading} />
        <StatCard title="High Risk Villages" value={stats.highRiskVillages} icon="🚨" color="red" loading={loading} />
      </div>

      {/* Northeast Regional Risk Map */}
      <div className="card bg-slate-950 border-slate-800 p-4">
        <h3 className="text-sm font-bold text-slate-200 mb-3">Northeast Regional Risk Map</h3>
        <RiskMap assessments={assessments} />
      </div>
    </div>
  );
};

export default Dashboard;
