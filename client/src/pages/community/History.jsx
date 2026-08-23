import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { waterReportService } from '../../services/waterReportService';

const History = () => {
  const [activeTab, setActiveTab] = useState('health');
  const [healthReports, setHealthReports] = useState([]);
  const [waterReports, setWaterReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'health') {
          const res = await reportService.getReports();
          if (res.success) setHealthReports(res.data.reports || []);
        } else {
          const res = await waterReportService.getWaterReports();
          if (res.success) setWaterReports(res.data.reports || []);
        }
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">My Submitted Reports</h1>
        <p className="page-subtitle">Track status and details of your reported symptoms and water observations</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-200 p-1 rounded-xl">
        <button
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'health' ? 'bg-white text-brand-800 shadow-sm' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('health')}
        >
          🩺 Symptom Reports
        </button>
        <button
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'water' ? 'bg-white text-brand-800 shadow-sm' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('water')}
        >
          💧 Water Reports
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-20 skeleton"></div>
          <div className="h-20 skeleton"></div>
        </div>
      ) : activeTab === 'health' ? (
        healthReports.length === 0 ? (
          <div className="card text-center py-10 text-gray-500 text-sm">No health reports submitted yet.</div>
        ) : (
          <div className="space-y-3">
            {healthReports.map((report) => (
              <div key={report._id} className="card p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 capitalize">
                      Symptoms: {report.symptoms?.join(', ')}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Submitted on {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      report.status === 'VERIFIED'
                        ? 'bg-blue-100 text-blue-800'
                        : report.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {report.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <div>Duration: <b>{report.duration} day(s)</b></div>
                  <div>Affected: <b>{report.affectedPeople} person(s)</b></div>
                  <div>Water source: <b className="capitalize">{report.waterSource || 'N/A'}</b></div>
                  <div>Village: <b>{report.village}</b></div>
                </div>

                {report.verificationNotes && (
                  <div className="text-xs bg-blue-50 text-blue-900 p-2 rounded border border-blue-100">
                    <b>Health Worker Notes:</b> {report.verificationNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : waterReports.length === 0 ? (
        <div className="card text-center py-10 text-gray-500 text-sm">No water reports submitted yet.</div>
      ) : (
        <div className="space-y-3">
          {waterReports.map((report) => (
            <div key={report._id} className="card p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-gray-900 capitalize">
                    {report.issueType?.replace('_', ' ')}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Source: {report.waterSource} • {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-bold">
                  {report.severity}
                </span>
              </div>
              {report.description && (
                <p className="text-xs text-gray-600 italic">{report.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
