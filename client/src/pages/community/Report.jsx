import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { reportService } from '../../services/reportService';
import { waterReportService } from '../../services/waterReportService';
import { enqueueReport, enqueueWaterReport } from '../../utils/offlineQueue';

const SYMPTOMS_LIST = [
  { id: 'diarrhea', label: 'Diarrhea', icon: '💧' },
  { id: 'vomiting', label: 'Vomiting', icon: '🤢' },
  { id: 'fever', label: 'Fever', icon: '🌡️' },
  { id: 'dehydration', label: 'Dehydration', icon: '🏜️' },
  { id: 'abdominal_pain', label: 'Stomach Pain', icon: '⚡' },
  { id: 'other', label: 'Other', icon: '❓' },
];

const WATER_SOURCES = [
  { id: 'river', label: 'River Water' },
  { id: 'well', label: 'Well / Ring Well' },
  { id: 'hand_pump', label: 'Hand Pump / Tube Well' },
  { id: 'tap', label: 'Tap Water / Piped Supply' },
  { id: 'pond', label: 'Pond / Lake' },
  { id: 'other', label: 'Other Source' },
];

const WATER_ISSUES = [
  { id: 'dirty_water', label: 'Dirty / Muddy Water' },
  { id: 'bad_smell', label: 'Bad Smell or Taste' },
  { id: 'flood_contamination', label: 'Flood Contamination' },
  { id: 'suspected_contamination', label: 'Suspected Chemical / Waste' },
  { id: 'broken_water_source', label: 'Broken Pump / Pipe' },
];

const Report = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'water' ? 'water' : 'health';
  const [activeTab, setActiveTab] = useState(initialTab);

  const { user } = useAuth();
  const { isOnline } = useOfflineSync();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Health report state
  const [symptoms, setSymptoms] = useState([]);
  const [duration, setDuration] = useState(1);
  const [affectedPeople, setAffectedPeople] = useState(1);
  const [waterSource, setWaterSource] = useState('well');
  const [waterIssues, setWaterIssues] = useState(['no_issue']);
  const [description, setDescription] = useState('');

  // Water report state
  const [issueType, setIssueType] = useState('dirty_water');
  const [severity, setSeverity] = useState('MEDIUM');

  const toggleSymptom = (id) => {
    setSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleWaterIssue = (id) => {
    setWaterIssues((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleHealthSubmit = async (e) => {
    e.preventDefault();
    if (symptoms.length === 0) {
      setErrorMsg('Please select at least one symptom.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    const payload = {
      state: user?.state || 'Assam',
      district: user?.district || 'Kamrup',
      village: user?.village || 'Majuli Village',
      symptoms,
      duration: Number(duration),
      affectedPeople: Number(affectedPeople),
      waterSource,
      waterIssues,
      description,
    };

    try {
      if (!isOnline) {
        enqueueReport(payload);
        setSuccessMsg('Report saved locally! It will automatically sync when you reconnect.');
      } else {
        const res = await reportService.createReport(payload);
        if (res.success) {
          setSuccessMsg('Report submitted successfully! Thank you for helping keep your community safe.');
        }
      }
      setTimeout(() => navigate('/community/history'), 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWaterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const payload = {
      state: user?.state || 'Assam',
      district: user?.district || 'Kamrup',
      village: user?.village || 'Majuli Village',
      waterSource,
      issueType,
      severity,
      description,
    };

    try {
      if (!isOnline) {
        enqueueWaterReport(payload);
        setSuccessMsg('Water issue report saved locally! It will sync when online.');
      } else {
        const res = await waterReportService.createWaterReport(payload);
        if (res.success) {
          setSuccessMsg('Water issue report submitted successfully.');
        }
      }
      setTimeout(() => navigate('/community/dashboard'), 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit water report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Tabs */}
      <div className="flex bg-gray-200 p-1 rounded-xl">
        <button
          className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'health' ? 'bg-white text-brand-800 shadow-sm' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('health')}
        >
          🩺 Symptom Report
        </button>
        <button
          className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'water' ? 'bg-white text-brand-800 shadow-sm' : 'text-gray-600'
          }`}
          onClick={() => setActiveTab('water')}
        >
          💧 Water Issue Report
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm font-semibold rounded-xl">
          ✅ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm font-semibold rounded-xl">
          ⚠️ {errorMsg}
        </div>
      )}

      {!isOnline && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl font-medium">
          📡 You are currently offline. Submissions will be saved to your device and synced automatically when network is restored.
        </div>
      )}

      {activeTab === 'health' ? (
        <form onSubmit={handleHealthSubmit} className="card space-y-6">
          <div>
            <label className="form-label text-base font-bold mb-3 block">
              1. Select Symptoms Observed <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {SYMPTOMS_LIST.map((item) => {
                const selected = symptoms.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSymptom(item.id)}
                    className={`p-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                      selected
                        ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold shadow-sm'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Duration (Days)</label>
              <input
                type="number"
                min="1"
                max="30"
                className="form-input text-lg font-bold"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">People Affected</label>
              <input
                type="number"
                min="1"
                max="100"
                className="form-input text-lg font-bold"
                value={affectedPeople}
                onChange={(e) => setAffectedPeople(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Primary Water Source</label>
            <select
              className="form-select text-base py-3"
              value={waterSource}
              onChange={(e) => setWaterSource(e.target.value)}
            >
              {WATER_SOURCES.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label font-semibold mb-2 block">Water Quality Issues (Optional)</label>
            <div className="space-y-2">
              {WATER_ISSUES.map((wi) => (
                <label
                  key={wi.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={waterIssues.includes(wi.id)}
                    onChange={() => toggleWaterIssue(wi.id)}
                    className="w-4 h-4 text-brand-600 rounded"
                  />
                  <span>{wi.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Additional Description</label>
            <textarea
              rows={3}
              className="form-input"
              placeholder="e.g. Water turned yellow after heavy rainfall..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-[11px] rounded-lg">
            ℹ️ Note: This report collects symptom observations for public health monitoring. It is not a medical diagnosis.
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Health Report 🚀'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleWaterSubmit} className="card space-y-6">
          <div>
            <label className="form-label">Water Source Affected</label>
            <select
              className="form-select py-3 text-base"
              value={waterSource}
              onChange={(e) => setWaterSource(e.target.value)}
            >
              {WATER_SOURCES.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Observed Problem / Issue Type</label>
            <select
              className="form-select py-3 text-base"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
            >
              {WATER_ISSUES.map((wi) => (
                <option key={wi.id} value={wi.id}>
                  {wi.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Issue Severity</label>
            <div className="grid grid-cols-3 gap-3">
              {['LOW', 'MEDIUM', 'HIGH'].map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverity(sev)}
                  className={`py-3 rounded-lg border text-xs font-bold ${
                    severity === sev
                      ? 'border-brand-700 bg-brand-50 text-brand-800'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Details / Description</label>
            <textarea
              rows={3}
              className="form-input"
              placeholder="Describe the water condition or location detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Water Report 🌊'}
          </button>
        </form>
      )}
    </div>
  );
};

export default Report;
