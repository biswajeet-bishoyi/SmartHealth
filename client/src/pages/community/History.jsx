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
    <div className="space-y-6 max-w-4xl mx-auto py-2 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0b1c30] dark:text-white font-headline">
          My Submitted Reports
        </h1>
        <p className="text-xs text-[#737780] dark:text-[#94a3b8] mt-1">
          Track the live 4-stage journey and field inspection status of your submitted observations
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-[#0c1f36] p-1.5 rounded-2xl border border-gray-200 dark:border-[#1f3c60] gap-2 shadow-inner">
        <button
          type="button"
          className={`flex-1 py-2.5 px-4 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'health'
              ? 'bg-[#001e40] dark:bg-[#003366] text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:text-[#001e40] dark:hover:text-white'
          }`}
          onClick={() => setActiveTab('health')}
        >
          <span>🩺 Symptom Reports</span>
          {healthReports.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white font-mono">
              {healthReports.length}
            </span>
          )}
        </button>
        <button
          type="button"
          className={`flex-1 py-2.5 px-4 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'water'
              ? 'bg-[#001e40] dark:bg-[#003366] text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:text-[#001e40] dark:hover:text-white'
          }`}
          onClick={() => setActiveTab('water')}
        >
          <span>💧 Water Reports</span>
          {waterReports.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-cyan-500 text-white font-mono">
              {waterReports.length}
            </span>
          )}
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
              <div key={report._id} className="card p-5 space-y-4 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                        REF: {report._id.slice(-8).toUpperCase()}
                      </span>
                      <h4 className="font-extrabold text-sm text-gray-900 dark:text-white capitalize">
                        {report.symptoms?.join(', ')}
                      </h4>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-2">
                      <span>🕒 Submitted: {new Date(report.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      <span>• 📍 {report.village}, {report.district}</span>
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider self-start sm:self-auto border ${
                      report.status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                        : report.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 animate-pulse'
                    }`}
                  >
                    {report.status === 'VERIFIED' ? '✓ Verified' : report.status === 'PENDING' ? '⏳ Under Review' : report.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-gray-50 dark:bg-[#0c1f1c] p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                  <div>Duration: <b>{report.duration} day(s)</b></div>
                  <div>Affected: <b>{report.affectedPeople} person(s)</b></div>
                  <div>Water Source: <b className="capitalize">{report.waterSources?.join(', ') || report.waterSource || 'Well'}</b></div>
                  <div>Channel: <b className="font-mono">{report.sourceChannel || 'APP'}</b></div>
                </div>

                {/* Live Tracking Route Stepper */}
                <div className="p-3.5 rounded-xl bg-gray-100/60 dark:bg-[#142c4a]/30 border border-gray-200 dark:border-gray-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 dark:text-gray-300">
                    <span className="flex items-center gap-1.5">
                      <i className="fa-solid fa-route text-emerald-600" />
                      <span>Live Triage Tracking Route:</span>
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      Dispatched to: PHC {report.village} / BPHC {report.district}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1 pt-1 text-[10px] text-center font-bold">
                    <div className="p-1.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                      1. Logged ✓
                    </div>
                    <div className={`p-1.5 rounded border ${
                      report.status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 animate-pulse'
                    }`}>
                      2. Triage Review
                    </div>
                    <div className={`p-1.5 rounded border ${
                      report.status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700'
                    }`}>
                      3. Field Verified
                    </div>
                    <div className="p-1.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700">
                      4. Risk Computed
                    </div>
                  </div>
                </div>

                {report.verificationNotes && (
                  <div className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-start gap-2">
                    <i className="fa-solid fa-user-doctor text-emerald-600 mt-0.5" />
                    <div>
                      <b>Health Worker Guidance & Inspection Note:</b>
                      <p className="mt-0.5">{report.verificationNotes}</p>
                    </div>
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
