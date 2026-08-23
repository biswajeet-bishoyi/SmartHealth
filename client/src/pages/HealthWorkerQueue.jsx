import React, { useState, useEffect } from 'react';
import api from '../utils/axiosInstance';
import RiskBadge from '../components/RiskBadge';

export default function HealthWorkerQueue() {
  const [assessments, setAssessments] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [riskRes, predRes] = await Promise.allSettled([
          api.get('/risk'),
          api.get('/predictions'),
        ]);

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

    fetchData();
  }, []);

  const filteredList = assessments.filter(a => {
    const matchesSearch = a.village?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.district?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.riskLevel === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPredictionForVillage = (village) => {
    return predictions.find(p => p.village === village);
  };

  return (
    <div className="max-w-7xl mx-auto py-4 space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] dark:border-[#1f3c60] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#e5eeff] dark:bg-[#142c4a] text-[#001e40] dark:text-[#a7c8ff] text-base">
              📋
            </span>
            <h1 className="text-2xl font-extrabold text-[#0b1c30] dark:text-white font-headline tracking-tight">
              Priority Verification Queue
            </h1>
          </div>
          <p className="text-xs text-[#737780] mt-1">
            Field health officer triage: review incoming cluster observations, verify risk assessments, and dispatch rapid advisories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-[#001e40] text-[#a7c8ff] text-xs font-bold font-mono">
            {filteredList.length} QUEUED LOCATIONS
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Priority Table (8 cols) */}
        <div className="lg:col-span-8 card p-0 overflow-hidden space-y-0">
          {/* Table Toolbar */}
          <div className="p-4 bg-[#f8f9ff] dark:bg-[#061324] border-b border-[#e2e8f0] dark:border-[#1f3c60] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-[#0b1c30] dark:text-white font-headline">
              Locations Awaiting Action
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
                {filteredList.map((item) => {
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
                              style={{ width: `${Math.min(100, (item.vulnerabilityScore || 45))}%` }}
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
                <button
                  type="button"
                  onClick={() => alert(`Verification confirmed for ${selectedItem.village}. Alert escalation triggered.`)}
                  className="w-full btn btn-primary py-3 text-xs font-bold shadow-md cursor-pointer"
                >
                  ✓ Verify & Escalate Alert
                </button>
                <button
                  type="button"
                  onClick={() => alert(`Water quality inspection scheduled for ${selectedItem.village}.`)}
                  className="w-full btn btn-secondary py-3 text-xs font-bold cursor-pointer"
                >
                  💧 Schedule Water Inspection
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center text-xs text-[#737780]">
              Select a location from the queue to view detailed verification metrics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
