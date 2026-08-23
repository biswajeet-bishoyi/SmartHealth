import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosInstance';
import RiskBadge from '../../components/RiskBadge';

/**
 * ResourcePlanning
 * ----------------
 * Public Health Resource Allocation & Priority Dashboard.
 * Ranks locations by composite priority score (Risk + Environmental + Vulnerability),
 * lists available physical/human resources, and enables assignment to outbreak zones.
 */
export default function ResourcePlanning() {
  const [priorityData, setPriorityData] = useState([]);
  const [resources, setResources] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [selectedResource, setSelectedResource] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [priorityRes, resRes, assignRes] = await Promise.allSettled([
        api.get('/resources/priority-dashboard'),
        api.get('/resources'),
        api.get('/resources/assignments?limit=50'),
      ]);

      if (priorityRes.status === 'fulfilled' && priorityRes.value.data?.success) {
        setPriorityData(priorityRes.value.data.data || []);
      }
      if (resRes.status === 'fulfilled' && resRes.value.data?.success) {
        setResources(resRes.value.data.data || []);
      }
      if (assignRes.status === 'fulfilled' && assignRes.value.data?.success) {
        setAssignments(assignRes.value.data.data?.assignments || []);
      }
    } catch (err) {
      console.error('Failed to load resource data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedVillage || !selectedResource) return;

    try {
      setAssigning(true);
      setMessage(null);
      const res = await api.post('/resources/assignments', {
        resourceId: selectedResource,
        village: selectedVillage.village,
        district: selectedVillage.district,
        state: selectedVillage.state,
      });

      if (res.data?.success) {
        setMessage({ type: 'success', text: `Resource assigned to ${selectedVillage.village} successfully!` });
        setShowAssignModal(false);
        fetchData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Assignment failed' });
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusUpdate = async (assignmentId, status) => {
    try {
      await api.patch(`/resources/assignments/${assignmentId}`, { status });
      fetchData();
    } catch (err) {
      console.error('Failed to update assignment status:', err);
    }
  };

  const availableResources = resources.filter(r => r.currentAssignmentStatus === 'AVAILABLE');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-xl bg-[#001e40] text-white flex items-center justify-center text-base border border-[#003366]">
              <i className="fa-solid fa-truck-medical text-[#6cf8bb]" />
            </span>
            <h1 className="text-2xl font-black text-[#0b1c30] dark:text-white tracking-tight font-headline">
              Resource Allocation & Priority Dashboard
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Deploy medical field teams, water-testing labs, and emergency supplies to areas with highest priority score.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            {availableResources.length} Units Available for Dispatch
          </span>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs font-bold ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Priority Rankings Table */}
      <div className="bg-white dark:bg-[#0c1f1c] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-[#0b1c30] dark:text-white flex items-center gap-2 font-headline">
              <i className="fa-solid fa-bullseye text-[#001e40] dark:text-[#a7c8ff]" />
              <span>High-Priority Outbreak Locations</span>
            </h3>
            <p className="text-xs text-gray-500">
              Ranked by composite Priority Score = 60% Risk + 20% Environmental + 20% Community Vulnerability
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading priority rankings...</div>
        ) : priorityData.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">No elevated risk locations detected currently.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 font-bold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="p-3.5">Priority Rank</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Composite Priority</th>
                  <th className="p-3.5">Current Risk</th>
                  <th className="p-3.5">Vulnerability</th>
                  <th className="p-3.5">Active Deployments</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {priorityData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition">
                    <td className="p-3.5">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-[11px] ${
                        idx === 0 ? 'bg-rose-500 text-white' : idx === 1 ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-gray-900 dark:text-white">{item.village}</p>
                      <p className="text-[10px] text-gray-400">{item.district}, {item.state}</p>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-[#001e40] dark:text-[#a7c8ff]">{item.priorityScore}</span>
                        <div className="w-16 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-rose-500 rounded-full"
                            style={{ width: `${item.priorityScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <RiskBadge level={item.riskLevel} score={item.riskScore} />
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {item.vulnerabilityScore}/100
                      </span>
                    </td>
                    <td className="p-3.5">
                      {item.activeAssignments && item.activeAssignments.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.activeAssignments.map((a, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[10px] font-bold">
                              {a.resourceId?.name || 'Assigned'}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                          <i className="fa-solid fa-triangle-exclamation" />
                          <span>No resources deployed</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVillage(item);
                          setShowAssignModal(true);
                        }}
                        className="px-3 py-1.5 btn btn-primary text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                      >
                        Deploy Resources
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deployable Resources & Active Deployments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Resource Inventory */}
        <div className="bg-white dark:bg-[#0c1f1c] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#0b1c30] dark:text-white flex items-center gap-2 font-headline">
            <i className="fa-solid fa-boxes-stacked text-[#001e40] dark:text-[#a7c8ff]" />
            <span>Deployable Public Health Units ({resources.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {resources.map((r, i) => (
              <div key={i} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                    {r.type.replace(/_/g, ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    r.currentAssignmentStatus === 'AVAILABLE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {r.currentAssignmentStatus}
                  </span>
                </div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">{r.name}</p>
                <p className="text-[10px] text-gray-500">Base: {r.homeDistrict || 'Central'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live Active Deployments */}
        <div className="bg-white dark:bg-[#0c1f1c] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🚀</span> Active Field Deployments ({assignments.length})
          </h3>

          {assignments.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No active resource assignments.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-80 overflow-y-auto">
              {assignments.map((a, i) => (
                <div key={i} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {a.resourceId?.name || 'Resource'} → {a.village}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      Deployed {new Date(a.assignedAt || a.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={a.status}
                      onChange={(e) => handleStatusUpdate(a._id, e.target.value)}
                      className="px-2 py-1 text-[11px] font-bold rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                    >
                      <option value="ASSIGNED">ASSIGNED</option>
                      <option value="IN_TRANSIT">IN_TRANSIT</option>
                      <option value="ON_SITE">ON_SITE</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedVillage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleAssign} className="bg-white dark:bg-[#0c1f1c] border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Deploy Resource to {selectedVillage.village}
              </h3>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Deploy an available health worker team or testing unit to support {selectedVillage.village} ({selectedVillage.district}).
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Select Deployable Unit
                </label>
                <select
                  required
                  value={selectedResource}
                  onChange={(e) => setSelectedResource(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="">-- Select Available Resource --</option>
                  {availableResources.map(r => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.type.replace(/_/g, ' ')}) — Cap: {r.capacity}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={assigning || !selectedResource}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition"
              >
                {assigning ? 'Dispatching...' : 'Confirm Dispatch'}
              </button>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
