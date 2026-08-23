import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosInstance';

/**
 * AuditLog
 * --------
 * Append-only immutable audit trail view for National Admins.
 * Tracks report verification, alert approvals, resource assignments,
 * config changes, and user actions with actor snapshots and timestamps.
 */
export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 25,
        ...(actionFilter && { action: actionFilter }),
        ...(entityFilter && { entityType: entityFilter }),
      });

      const res = await api.get(`/audit?${params.toString()}`);
      if (res.data?.success) {
        setLogs(res.data.data.logs || []);
        setTotalPages(res.data.data.pages || 1);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityFilter]);

  const ACTION_COLORS = {
    ALERT_BROADCAST: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
    ALERT_APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
    ALERT_VERIFIED: 'bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300',
    ALERT_CREATED: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
    RESOURCE_ASSIGNED: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300',
    CONFIG_UPDATED: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
    REPORT_VERIFIED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-xl bg-[#001e40] text-white flex items-center justify-center text-base border border-[#003366]">
              <i className="fa-solid fa-shield-halved text-[#6cf8bb]" />
            </span>
            <h1 className="text-2xl font-black text-[#0b1c30] dark:text-white tracking-tight font-headline">
              System Audit & Compliance Log
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Append-only governance trail. Every sensitive action, decision, and configuration change is permanently logged.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 self-start md:self-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Immutable Storage Policy Active</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#0c1f1c] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-gray-400">Filter by Action</label>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
          >
            <option value="">All Actions</option>
            <option value="ALERT_BROADCAST">ALERT_BROADCAST</option>
            <option value="ALERT_APPROVED">ALERT_APPROVED</option>
            <option value="ALERT_VERIFIED">ALERT_VERIFIED</option>
            <option value="ALERT_CREATED">ALERT_CREATED</option>
            <option value="RESOURCE_ASSIGNED">RESOURCE_ASSIGNED</option>
            <option value="CONFIG_UPDATED">CONFIG_UPDATED</option>
            <option value="WATER_SOURCE_INSPECTED">WATER_SOURCE_INSPECTED</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-gray-400">Filter by Entity</label>
          <select
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
          >
            <option value="">All Entities</option>
            <option value="Alert">Alert</option>
            <option value="HealthReport">HealthReport</option>
            <option value="ResourceAssignment">ResourceAssignment</option>
            <option value="RiskConfig">RiskConfig</option>
            <option value="WaterSource">WaterSource</option>
          </select>
        </div>

        {(actionFilter || entityFilter) && (
          <button
            onClick={() => { setActionFilter(''); setEntityFilter(''); setPage(1); }}
            className="mt-4 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-[#0c1f1c] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">No audit events match the selected criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 font-bold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Actor</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Target Entity</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {logs.map((log) => {
                  const colorClass = ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';

                  return (
                    <tr key={log._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition">
                      <td className="p-3.5 font-mono text-[11px] text-gray-500">
                        {new Date(log.occurredAt).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {log.actorName || 'System Service'}
                        </p>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {log.actorRole}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${colorClass}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono text-gray-700 dark:text-gray-300 font-medium">
                          {log.entityType}
                        </span>
                        {log.entityId && (
                          <span className="block text-[10px] text-gray-400 font-mono">
                            ID: {String(log.entityId).substring(0, 8)}...
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-gray-600 dark:text-gray-400">
                        {log.village ? `${log.village}, ${log.district}` : '—'}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-bold transition"
                        >
                          View Diff
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-xs">
          <span className="text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 font-bold"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 font-bold"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Diff Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0c1f1c] border border-gray-200 dark:border-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Audit Snapshot Details
                </h3>
                <p className="text-[11px] text-gray-500 font-mono">
                  {selectedLog.action} at {new Date(selectedLog.occurredAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-500 uppercase">Previous State</p>
                <pre className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-[11px] font-mono text-gray-700 dark:text-gray-300 overflow-x-auto border border-gray-200 dark:border-gray-800 max-h-60">
                  {selectedLog.previousValue ? JSON.stringify(selectedLog.previousValue, null, 2) : '(none / initial creation)'}
                </pre>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-500 uppercase">New State</p>
                <pre className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-[11px] font-mono text-teal-700 dark:text-teal-300 overflow-x-auto border border-gray-200 dark:border-gray-800 max-h-60">
                  {selectedLog.newValue ? JSON.stringify(selectedLog.newValue, null, 2) : '(none)'}
                </pre>
              </div>
            </div>

            <button
              onClick={() => setSelectedLog(null)}
              className="w-full py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
