import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosInstance';
import RiskBadge from '../../components/RiskBadge';

const Villages = () => {
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVillages = async () => {
      try {
        setLoading(true);
        const res = await api.get('/health-worker/risk');
        if (res.data?.success) {
          setVillages(res.data.data.assessments || []);
        }
      } catch (err) {
        console.error('Error fetching villages risk overview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVillages();
  }, []);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Village Health & Risk Overview</h1>
        <p className="page-subtitle">Aggregated village-level monitoring parameters for public health tracking</p>
      </div>

      {loading ? (
        <div className="h-40 skeleton"></div>
      ) : villages.length === 0 ? (
        <div className="card text-center py-12 text-gray-500 text-sm">No village risk data available.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {villages.map((item) => (
            <div key={item._id} className="card p-5 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-base">{item.village}</h3>
                <RiskBadge level={item.riskLevel} score={item.riskScore} />
              </div>

              <p className="text-xs text-gray-500">
                District: <b>{item.district}</b>, {item.state}
              </p>

              {/* Component breakdown */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div>
                  <span className="text-gray-500">Symptom Score:</span> <b className="text-gray-900">{item.symptomScore}</b>
                </div>
                <div>
                  <span className="text-gray-500">Growth Score:</span> <b className="text-gray-900">{item.growthScore}</b>
                </div>
                <div>
                  <span className="text-gray-500">Water Score:</span> <b className="text-gray-900">{item.waterScore}</b>
                </div>
                <div>
                  <span className="text-gray-500">Cluster Score:</span> <b className="text-gray-900">{item.clusterScore}</b>
                </div>
              </div>

              <p className="text-[10px] text-gray-400 italic">
                Calculated on {new Date(item.calculatedAt).toLocaleString()} ({item.reportCount} contributing reports)
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Villages;
