import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosInstance';
import RiskMap from '../../components/RiskMap';
import RiskBadge from '../../components/RiskBadge';

const Risk = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRisk = async () => {
      try {
        setLoading(true);
        const res = await api.get('/health-worker/risk');
        if (res.data?.success) {
          setAssessments(res.data.data.assessments || []);
        }
      } catch (err) {
        console.error('Error fetching risk data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRisk();
  }, []);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Risk Assessment Engine Output</h1>
        <p className="page-subtitle">Transparent mathematical formula: Symptom (40%) + Growth (25%) + Water (20%) + Cluster (15%)</p>
      </div>

      {/* Interactive Risk Map */}
      <div className="card p-4">
        <h3 className="font-bold text-gray-900 text-sm mb-3">Geographic Risk Distribution Map</h3>
        <RiskMap assessments={assessments} />
      </div>

      {/* Auditability Table */}
      <div className="card overflow-x-auto">
        <h3 className="font-bold text-gray-900 text-sm mb-3">Auditable Component Breakdown</h3>
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-100 text-gray-700 font-semibold uppercase">
            <tr>
              <th className="p-3">Village</th>
              <th className="p-3">District</th>
              <th className="p-3">Symptom (40%)</th>
              <th className="p-3">Growth (25%)</th>
              <th className="p-3">Water (20%)</th>
              <th className="p-3">Cluster (15%)</th>
              <th className="p-3">Total Score</th>
              <th className="p-3">Risk Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assessments.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="p-3 font-bold text-gray-900">{item.village}</td>
                <td className="p-3 text-gray-600">{item.district}</td>
                <td className="p-3 font-mono">{item.symptomScore}</td>
                <td className="p-3 font-mono">{item.growthScore}</td>
                <td className="p-3 font-mono">{item.waterScore}</td>
                <td className="p-3 font-mono">{item.clusterScore}</td>
                <td className="p-3 font-mono font-bold text-gray-900">{item.riskScore}/100</td>
                <td className="p-3">
                  <RiskBadge level={item.riskLevel} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Risk;
