import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axiosInstance';
import RiskBadge from '../components/RiskBadge';

export default function HealthWorkerQueue() {
  const [activeTab, setActiveTab] = useState('REPORTS'); // 'REPORTS' | 'VILLAGE_RISK'
  const [reports, setReports] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('PENDING'); // 'PENDING' | 'VERIFIED' | 'REJECTED' | 'ALL'
  const [riskStatusFilter, setRiskStatusFilter] = useState('ALL');
  const [notesMap, setNotesMap] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportsRes, riskRes, predRes] = await Promise.allSettled([
        api.get('/reports'),
        api.get('/risk'),
        api.get('/predictions'),
      ]);

      if (reportsRes.status === 'fulfilled' && reportsRes.value.data?.success) {
        setReports(reportsRes.value.data.data.reports || []);
      }

      let riskList = [];
      if (riskRes.status === 'fulfilled' && riskRes.value.data?.success) {
        riskList = riskRes.value.data.data.assessments || [];
        setAssessments(riskList);
        if (riskList.length > 0) setSelectedItem(riskList[0]);
      }

      if (predRes.status === 'fulfilled' && predRes.value.data?.success) {
        setPredictions(predRes.value.data.data.predictions || []);
      }
    } catch (err) {
      console.error('Failed to load verification queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifyReport = async (reportId, status) => {
    try {
      setActionLoadingId(reportId);
      const notes = notesMap[reportId] || (status === 'VERIFIED' ? 'Clinical symptoms and water sample verified by on-site health officer.' : 'Marked as false observation.');
      
      const res = await api.patch(`/health-worker/reports/${reportId}/verify`, {
        status,
        verificationNotes: notes,
      });

      if (res.data?.success) {
        setReports(prev =>
          prev.map(r => (r._id === reportId ? { ...r, status, verificationNotes: notes, verifiedAt: new Date() } : r))
        );
        setToastMessage(`Report ${reportId.slice(-6)} marked as ${status}`);
        setTimeout(() => setToastMessage(''), 3500);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update report status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch =
      r.village?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.symptoms?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = reportStatusFilter === 'ALL' || r.status === reportStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = reports.filter(r => r.status === 'PENDING').length;
  const verifiedCount = reports.filter(r => r.status === 'VERIFIED').length;

  const filteredAssessments = assessments.filter(a => {
    const matchesSearch =
      a.village?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.district?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = riskStatusFilter === 'ALL' || a.riskLevel === riskStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPredictionForVillage = (village) => {
    return predictions.find(p => p.village === village);
  };

  return (
    <div className="max-w-7xl mx-auto py-4 space-y-6 animate-fadeIn">
      {/* Top Header & Fast Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] dark:border-[#1f3c60] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#e5eeff] dark:bg-[#142c4a] text-[#001e40] dark:text-[#a7c8ff] text-base">
              🩺
            </span>
            <h1 className="text-2xl font-extrabold text-[#0b1c30] dark:text-white font-headline tracking-tight">
              Health Worker Verification & Triage
            </h1>
          </div>
          <p className="text-xs text-[#737780] mt-1">
            Clinical surveillance queue: verify incoming community reports, record diagnosis notes, and escalate cluster outbreak advisories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/report"
            className="btn btn-primary text-xs py-2.5 px-4 font-bold flex items-center gap-2 shadow-md"
          >
            <i className="fa-solid fa-plus-circle" />
            <span>+ File Health Worker Report</span>
          </Link>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold"
            title="Refresh Queue"
          >
            <i className="fa-solid fa-rotate-right" />
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <i className="fa-solid fa-circle-check text-emerald-600 text-base" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex bg-gray-100 dark:bg-[#0c1f36] p-1.5 rounded-2xl border border-gray-200 dark:border-[#1f3c60]">
        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'REPORTS'
              ? 'bg-[#001e40] text-white shadow-md'
              : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'
          }`}
        >
          <i className="fa-solid fa-list-check" />
          <span>Incoming Community Incident Reports</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
              {pendingCount} PENDING
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('VILLAGE_RISK')}
          className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'VILLAGE_RISK'
              ? 'bg-[#001e40] text-white shadow-md'
              : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'
          }`}
        >
          <i className="fa-solid fa-chart-line" />
          <span>Village Risk Queue & Predictive Triggers ({assessments.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: INDIVIDUAL COMMUNITY INCIDENT REPORTS ─────────────────────── */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#061324] p-4 rounded-xl border border-gray-200 dark:border-[#1f3c60]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-500">Filter Status:</span>
              <button
                onClick={() => setReportStatusFilter('PENDING')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  reportStatusFilter === 'PENDING'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                ⏳ Pending ({pendingCount})
              </button>
              <button
                onClick={() => setReportStatusFilter('VERIFIED')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  reportStatusFilter === 'VERIFIED'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                ✓ Verified ({verifiedCount})
              </button>
              <button
                onClick={() => setReportStatusFilter('REJECTED')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  reportStatusFilter === 'REJECTED'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                ✗ Rejected
              </button>
              <button
                onClick={() => setReportStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  reportStatusFilter === 'ALL'
                    ? 'bg-[#001e40] text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                All Reports ({reports.length})
              </button>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search symptoms, village, district..."
              className="px-3 py-1.5 bg-gray-50 dark:bg-[#0c1f36] border border-[#c3c6d1] dark:border-[#1f3c60] rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#003366] focus:outline-none w-full sm:w-64"
            />
          </div>

          {/* Reports List */}
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-500 font-bold">
              <i className="fa-solid fa-spinner animate-spin mr-2" /> Loading reports queue...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="card p-12 text-center space-y-2 text-gray-500 text-xs">
              <i className="fa-solid fa-clipboard-check text-3xl text-emerald-500" />
              <p className="font-bold">No reports found matching your filter criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div
                  key={report._id}
                  className={`card p-6 space-y-4 border-2 transition-all ${
                    report.status === 'PENDING'
                      ? 'border-amber-400 dark:border-amber-600/80 bg-amber-50/20 dark:bg-amber-950/10'
                      : report.status === 'VERIFIED'
                      ? 'border-emerald-500 dark:border-emerald-800 bg-white dark:bg-[#061324]'
                      : 'border-gray-200 dark:border-gray-800 opacity-70'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold bg-[#001e40] text-[#a7c8ff] px-2 py-0.5 rounded">
                        REF: {report._id.slice(-8).toUpperCase()}
                      </span>
                      <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                        📍 {report.village}, {report.district}, {report.state}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        • 🕒 {new Date(report.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider self-start sm:self-auto border ${
                        report.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                          : report.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
                          : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-400 animate-pulse'
                      }`}
                    >
                      {report.status === 'VERIFIED' ? '✓ Verified by Health Officer' : report.status === 'PENDING' ? '⏳ Awaiting Your Verification' : '✗ Rejected'}
                    </span>
                  </div>

                  {/* Syndromic & Environmental Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-gray-50 dark:bg-[#0c1f1c] p-3.5 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">Clinical Signs</span>
                      <span className="font-extrabold text-rose-700 dark:text-rose-300 capitalize">
                        {report.symptoms?.join(', ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">Affected Count</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {report.affectedPeople || 1} People
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">Duration</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {report.duration || 1} Day(s)
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">Water Source</span>
                      <span className="font-bold text-cyan-800 dark:text-cyan-300 capitalize">
                        {report.waterSources?.join(', ') || report.waterSource || 'Well'}
                      </span>
                    </div>
                  </div>

                  {report.description && (
                    <div className="text-xs text-gray-700 dark:text-gray-300 italic bg-gray-100/60 dark:bg-[#142c4a]/30 p-2.5 rounded-lg">
                      💬 "{report.description}"
                    </div>
                  )}

                  {/* Verification Actions (If PENDING) */}
                  {report.status === 'PENDING' ? (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-1">
                          <i className="fa-solid fa-pen text-[#003366] dark:text-[#a7c8ff]" />
                          <span>Health Worker Clinical / Inspection Notes (Recorded to Provenance Audit Trail):</span>
                        </label>
                        <input
                          type="text"
                          value={notesMap[report._id] || ''}
                          onChange={(e) => setNotesMap({ ...notesMap, [report._id]: e.target.value })}
                          placeholder="e.g. Field visit completed. Prescribed Zinc & ORS; FTK water test indicates elevated turbidity."
                          className="w-full px-3.5 py-2 text-xs bg-white dark:bg-[#0c1f36] border border-gray-300 dark:border-[#1f3c60] rounded-xl focus:ring-2 focus:ring-[#003366] focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-3 justify-end">
                        <button
                          type="button"
                          disabled={actionLoadingId === report._id}
                          onClick={() => handleVerifyReport(report._id, 'REJECTED')}
                          className="btn btn-secondary text-xs py-2.5 px-4 font-bold text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 border-rose-300 cursor-pointer"
                        >
                          ✗ Reject Observation
                        </button>
                        <button
                          type="button"
                          disabled={actionLoadingId === report._id}
                          onClick={() => handleVerifyReport(report._id, 'VERIFIED')}
                          className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2.5 px-6 font-black shadow-md flex items-center gap-2 cursor-pointer"
                        >
                          {actionLoadingId === report._id ? (
                            <i className="fa-solid fa-spinner animate-spin" />
                          ) : (
                            <i className="fa-solid fa-check-double" />
                          )}
                          <span>✓ Verify Report & Update Risk Model</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    report.verificationNotes && (
                      <div className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-start gap-2">
                        <i className="fa-solid fa-user-doctor text-emerald-600 mt-0.5" />
                        <div>
                          <span className="font-bold">Recorded Health Officer Note: </span>
                          <span>{report.verificationNotes}</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: VILLAGE RISK QUEUE & PREDICTIVE TRIGGERS ─────────────────── */}
      {activeTab === 'VILLAGE_RISK' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Priority Table (8 cols) */}
          <div className="lg:col-span-8 card p-0 overflow-hidden space-y-0">
            {/* Table Toolbar */}
            <div className="p-4 bg-[#f8f9ff] dark:bg-[#061324] border-b border-[#e2e8f0] dark:border-[#1f3c60] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-[#0b1c30] dark:text-white font-headline">
                Geographic Risk Priority
              </h2>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search village or district..."
                  className="px-3 py-1.5 bg-white dark:bg-[#0c1f36] border border-[#c3c6d1] dark:border-[#1f3c60] rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#003366] focus:outline-none w-48 sm:w-56"
                />
                <select
                  value={riskStatusFilter}
                  onChange={(e) => setRiskStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-[#0c1f36] border border-[#c3c6d1] dark:border-[#1f3c60] rounded-lg text-xs font-bold"
                >
                  <option value="ALL">All Tiers</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            {/* Verification Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#e5eeff] dark:bg-[#142c4a] text-[#001e40] dark:text-[#a7c8ff] font-bold border-b border-[#c3c6d1] dark:border-[#1f3c60]">
                  <tr>
                    <th className="p-3.5 pl-4">Location</th>
                    <th className="p-3.5">Current Risk</th>
                    <th className="p-3.5">Predicted (7-Day)</th>
                    <th className="p-3.5">Vulnerability</th>
                    <th className="p-3.5">Observations</th>
                    <th className="p-3.5 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] dark:divide-[#1f3c60]">
                  {filteredAssessments.map((item) => {
                    const isSelected = selectedItem?.village === item.village;
                    const pred = getPredictionForVillage(item.village);

                    return (
                      <tr
                        key={item._id || item.village}
                        onClick={() => setSelectedItem(item)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#dce9ff] dark:bg-[#142c4a] font-semibold text-[#001e40] dark:text-white'
                            : 'hover:bg-[#f8f9ff] dark:hover:bg-[#061324] text-[#0b1c30] dark:text-[#eaf1ff]'
                        }`}
                      >
                        <td className="p-3.5 pl-4">
                          <div className="font-bold text-[#0b1c30] dark:text-white">{item.village}</div>
                          <div className="text-[10px] text-[#737780]">{item.district}, {item.state}</div>
                        </td>
                        <td className="p-3.5">
                          <RiskBadge level={item.riskLevel} score={item.riskScore} />
                        </td>
                        <td className="p-3.5">
                          {pred && !pred.insufficientData ? (
                            <span className="font-bold text-[#001e40] dark:text-[#a7c8ff]">
                              {pred.predictedScore}/100 ({pred.predictedLevel})
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">Baseline</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#003366] dark:bg-[#799dd6]"
                                style={{ width: `${Math.min(100, item.vulnerabilityScore || 45)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold">{item.vulnerabilityScore || 45}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-bold">
                          {item.reportCount || 8}
                        </td>
                        <td className="p-3.5 pr-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#e5eeff] text-[#001e40] border border-[#003366]/30">
                            {item.riskLevel === 'CRITICAL' ? 'Immediate' : 'Queued'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Prediction Insight & Action Panel (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {selectedItem ? (
              <div className="card space-y-5 border-2 border-[#003366] shadow-xl">
                <div className="flex items-center justify-between border-b border-[#e2e8f0] dark:border-[#1f3c60] pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-[#0b1c30] dark:text-white font-headline">
                      {selectedItem.village}
                    </h3>
                    <p className="text-xs text-[#737780]">{selectedItem.district}, {selectedItem.state}</p>
                  </div>
                  <RiskBadge level={selectedItem.riskLevel} score={selectedItem.riskScore} />
                </div>

                {/* Contributing Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#737780]">
                    Surveillance Breakdown
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between p-2 rounded bg-[#f8f9ff] dark:bg-[#061324] border border-[#e2e8f0] dark:border-[#1f3c60]">
                      <span className="text-[#737780]">Symptom Burden:</span>
                      <span className="font-bold text-[#0b1c30] dark:text-white">{selectedItem.symptomScore}/100</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-[#f8f9ff] dark:bg-[#061324] border border-[#e2e8f0] dark:border-[#1f3c60]">
                      <span className="text-[#737780]">Surge Growth Rate:</span>
                      <span className="font-bold text-[#0b1c30] dark:text-white">{selectedItem.growthScore}/100</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-[#f8f9ff] dark:bg-[#061324] border border-[#e2e8f0] dark:border-[#1f3c60]">
                      <span className="text-[#737780]">Water Risk Factor:</span>
                      <span className="font-bold text-[#0b1c30] dark:text-white">{selectedItem.waterScore}/100</span>
                    </div>
                  </div>
                </div>

                {/* Health Worker Action Triggers */}
                <div className="space-y-2.5 pt-2 border-t border-[#e2e8f0] dark:border-[#1f3c60]">
                  <Link
                    to="/alerts"
                    className="w-full btn btn-primary py-3 text-xs font-bold shadow-md flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-tower-broadcast" />
                    <span>Broadcast Public Health Alert →</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="card p-8 text-center text-xs text-[#737780]">
                Select a location from the queue to view detailed verification metrics.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
