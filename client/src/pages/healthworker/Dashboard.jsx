import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useSocket from '../../hooks/useSocket';
import api from '../../utils/axiosInstance';
import StatCard from '../../components/StatCard';
import RiskBadge from '../../components/RiskBadge';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    verifiedReports: 0,
    reportsToday: 0,
    highRiskVillages: 0,
    activeAlerts: 0,
  });

  const [trends, setTrends] = useState([]);
  const [symptomDist, setSymptomDist] = useState([]);
  const [highRiskList, setHighRiskList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, trendsRes, riskRes] = await Promise.all([
        api.get('/health-worker/dashboard'),
        api.get('/health-worker/reports/trends'),
        api.get('/health-worker/risk'),
      ]);

      if (dashRes.data?.success) setStats(dashRes.data.data);
      if (trendsRes.data?.success) {
        setTrends(trendsRes.data.data.trends || []);
        setSymptomDist(trendsRes.data.data.symptomDistribution || []);
      }
      if (riskRes.data?.success) {
        const assessments = riskRes.data.data.assessments || [];
        setHighRiskList(assessments.filter((a) => a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL'));
      }
    } catch (err) {
      console.error('Error loading health worker dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen to Socket.IO events for live updates
  useEffect(() => {
    if (!socket) return;

    const handleNewReport = () => {
      fetchDashboardData();
    };

    const handleRiskUpdate = () => {
      fetchDashboardData();
    };

    socket.on('NEW_HEALTH_REPORT', handleNewReport);
    socket.on('RISK_LEVEL_UPDATED', handleRiskUpdate);

    return () => {
      socket.off('NEW_HEALTH_REPORT', handleNewReport);
      socket.off('RISK_LEVEL_UPDATED', handleRiskUpdate);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Health Worker Command Dashboard</h1>
          <p className="page-subtitle">District Monitoring & Report Verification Queue — {user?.district || 'Kamrup'}</p>
        </div>
        <Link to="/health-worker/reports" className="btn btn-primary text-xs">
          📥 Review Pending Reports ({stats.pendingReports})
        </Link>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Reports" value={stats.totalReports} icon="📋" color="blue" loading={loading} />
        <StatCard title="Pending Review" value={stats.pendingReports} icon="⏳" color="yellow" loading={loading} />
        <StatCard title="Reports Today" value={stats.reportsToday} icon="📅" color="brand" loading={loading} />
        <StatCard title="High Risk Villages" value={stats.highRiskVillages} icon="🚨" color="red" loading={loading} />
      </div>

      {/* High-Risk Villages Alert Table */}
      {highRiskList.length > 0 && (
        <div className="card border-l-4 border-red-500 bg-red-50 bg-opacity-30">
          <h3 className="font-bold text-red-900 text-sm mb-3 flex items-center gap-2">
            <span>🚨</span> Villages Requiring Immediate Field Verification ({highRiskList.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-red-100 text-red-900 font-semibold uppercase">
                <tr>
                  <th className="p-2.5">Village</th>
                  <th className="p-2.5">District</th>
                  <th className="p-2.5">Risk Score</th>
                  <th className="p-2.5">Level</th>
                  <th className="p-2.5">Reports</th>
                  <th className="p-2.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {highRiskList.map((item) => (
                  <tr key={item._id} className="hover:bg-red-100 hover:bg-opacity-50">
                    <td className="p-2.5 font-bold text-gray-900">{item.village}</td>
                    <td className="p-2.5 text-gray-600">{item.district}</td>
                    <td className="p-2.5 font-mono font-bold text-gray-900">{item.riskScore}/100</td>
                    <td className="p-2.5">
                      <RiskBadge level={item.riskLevel} />
                    </td>
                    <td className="p-2.5 text-gray-700">{item.reportCount}</td>
                    <td className="p-2.5">
                      <Link
                        to={`/health-worker/reports?village=${item.village}`}
                        className="btn btn-secondary py-1 px-2 text-[10px]"
                      >
                        Inspect Reports
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 14-Day Report Trends */}
        <div className="card">
          <h3 className="font-bold text-gray-900 text-sm mb-4">14-Day Report Volume Trend</h3>
          {trends.length === 0 ? (
            <p className="text-xs text-gray-400 py-12 text-center">No trend data recorded yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="count" stroke="#16a34a" fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Symptom Frequency Breakdown */}
        <div className="card">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Top Reported Symptoms</h3>
          {symptomDist.length === 0 ? (
            <p className="text-xs text-gray-400 py-12 text-center">No symptom distribution data available.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={symptomDist} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="_id" type="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip contentStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
