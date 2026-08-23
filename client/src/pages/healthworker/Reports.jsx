import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../utils/axiosInstance';
import ConfirmDialog from '../../components/ConfirmDialog';

const Reports = () => {
  const [searchParams] = useSearchParams();
  const villageFilterParam = searchParams.get('village') || '';

  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [villageFilter, setVillageFilter] = useState(villageFilterParam);
  const [loading, setLoading] = useState(true);

  // Selected report for verification modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [notes, setNotes] = useState('');
  const [actionType, setActionType] = useState(null); // 'VERIFIED' | 'REJECTED'
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (villageFilter) params.village = villageFilter;

      const res = await api.get('/reports', { params });
      if (res.data?.success) {
        setReports(res.data.data.reports || []);
      }
    } catch (err) {
      console.error('Error fetching reports queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, villageFilter]);

  const handleVerifyClick = (report, action) => {
    setSelectedReport(report);
    setActionType(action);
    setNotes('');
    setIsConfirmOpen(true);
  };

  const handleConfirmVerification = async () => {
    if (!selectedReport || !actionType) return;
    try {
      await api.patch(`/health-worker/reports/${selectedReport._id}/verify`, {
        status: actionType,
        verificationNotes: notes,
      });
      setIsConfirmOpen(false);
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification action failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Health Reports Review Queue</h1>
          <p className="page-subtitle">Inspect community observations, verify authenticity, or reject invalid reports</p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <select
            className="form-select text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <input
            type="text"
            className="form-input text-xs w-36"
            placeholder="Filter village..."
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-20 skeleton"></div>
          <div className="h-20 skeleton"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="card text-center py-12 text-gray-500 text-sm">
          No reports found for the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report._id}
              className={`card p-5 border-l-4 transition-shadow ${
                report.status === 'PENDING'
                  ? 'border-yellow-500 bg-yellow-50 bg-opacity-20'
                  : report.status === 'VERIFIED'
                  ? 'border-blue-500 bg-white'
                  : 'border-red-400 bg-gray-50'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-gray-900 capitalize">
                      Symptoms: {report.symptoms?.join(', ')}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
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

                  <p className="text-xs text-gray-600">
                    📍 <b>{report.village}</b>, {report.district}, {report.state} • Reported by:{' '}
                    <span className="font-semibold">{report.userId?.name || 'Community Member'}</span> ({report.userId?.phone || 'No phone'})
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-3 rounded-lg border border-gray-200">
                    <div>Duration: <b>{report.duration} days</b></div>
                    <div>Affected: <b>{report.affectedPeople} person(s)</b></div>
                    <div>Water Source: <b className="capitalize">{report.waterSource || 'N/A'}</b></div>
                    <div>Water Issues: <b>{report.waterIssues?.join(', ')}</b></div>
                  </div>

                  {report.description && (
                    <p className="text-xs text-gray-700 bg-gray-100 p-2.5 rounded italic">
                      "{report.description}"
                    </p>
                  )}

                  {report.verificationNotes && (
                    <p className="text-xs text-blue-900 bg-blue-50 p-2.5 rounded border border-blue-200">
                      <b>Verification Note:</b> {report.verificationNotes}
                    </p>
                  )}
                </div>

                {report.status === 'PENDING' && (
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleVerifyClick(report, 'VERIFIED')}
                      className="btn btn-primary text-xs py-2 px-4"
                    >
                      ✓ Verify
                    </button>
                    <button
                      onClick={() => handleVerifyClick(report, 'REJECTED')}
                      className="btn btn-danger text-xs py-2 px-4"
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verification Modal / Dialog */}
      {isConfirmOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {actionType === 'VERIFIED' ? '✓ Verify Health Report' : '✕ Reject Health Report'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Village: <b>{selectedReport.village}</b> | Symptoms: <b>{selectedReport.symptoms?.join(', ')}</b>
            </p>

            <div className="mb-4">
              <label className="form-label text-xs">Verification Notes / Field Findings</label>
              <textarea
                rows={3}
                className="form-input text-xs"
                placeholder="Add notes about your field inspection or verification decision..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button className="btn btn-secondary text-xs" onClick={() => setIsConfirmOpen(false)}>
                Cancel
              </button>
              <button
                className={`btn text-xs ${actionType === 'VERIFIED' ? 'btn-primary' : 'btn-danger'}`}
                onClick={handleConfirmVerification}
              >
                Confirm {actionType === 'VERIFIED' ? 'Verification' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
