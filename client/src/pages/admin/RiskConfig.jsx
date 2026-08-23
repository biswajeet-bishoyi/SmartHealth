import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosInstance';

/**
 * RiskConfig
 * ----------
 * National Admin Risk Engine Configuration Editor.
 * Modifies risk weights, priority score weights, symptom multipliers, and thresholds.
 * Every save is recorded in the AuditLog and invalidates the backend riskEngine cache.
 */
export default function RiskConfigPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/config');
      if (res.data?.success) {
        setConfig(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load risk config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (category, key, value) => {
    setConfig(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: parseFloat(value) || 0,
      },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      const res = await api.put('/config', config);
      if (res.data?.success) {
        setConfig(res.data.data);
        setMessage({ type: 'success', text: 'Risk configuration updated successfully and cached weights invalidated!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update configuration' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-xs text-gray-400">
        Loading risk configuration parameters...
      </div>
    );
  }

  const weightsSum = ((config.weights?.symptom || 0) + (config.weights?.growth || 0) + (config.weights?.water || 0) + (config.weights?.cluster || 0)).toFixed(2);
  const prioritySum = ((config.priorityWeights?.risk || 0) + (config.priorityWeights?.environmental || 0) + (config.priorityWeights?.vulnerability || 0)).toFixed(2);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-xl bg-[#001e40] text-white flex items-center justify-center text-base border border-[#003366]">
              <i className="fa-solid fa-sliders text-[#6cf8bb]" />
            </span>
            <h1 className="text-2xl font-black text-[#0b1c30] dark:text-white tracking-tight font-headline">
              Risk Engine Configuration
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure algorithm weights, priority layers, and classification thresholds. Changes are audited with version tracking.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-mono text-gray-700 dark:text-gray-300">
          Config Version: v{config.version || 1}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs font-bold ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Risk Score Weights (4 Components) */}
        <div className="bg-white dark:bg-[#0c1f1c] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Core Risk Score Weights (0–1.0)
              </h3>
              <p className="text-xs text-gray-500">
                Determines the formula for current risk score: symptom + growth + water + cluster
              </p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              weightsSum === '1.00' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              Sum: {weightsSum} (Ideal: 1.00)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Symptom Score Weight</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={config.weights?.symptom || 0.40}
                onChange={(e) => handleWeightChange('weights', 'symptom', e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Growth Score Weight</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={config.weights?.growth || 0.25}
                onChange={(e) => handleWeightChange('weights', 'growth', e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Water Issue Score Weight</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={config.weights?.water || 0.20}
                onChange={(e) => handleWeightChange('weights', 'water', e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Cluster Score Weight</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={config.weights?.cluster || 0.15}
                onChange={(e) => handleWeightChange('weights', 'cluster', e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Priority Score Weights (v2.0 Layer) */}
        <div className="bg-white dark:bg-[#0c1f1c] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Resource Priority Weights (0–1.0)
              </h3>
              <p className="text-xs text-gray-500">
                Formula: priorityScore = risk × weight + environmental × weight + vulnerability × weight
              </p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              prioritySum === '1.00' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              Sum: {prioritySum} (Ideal: 1.00)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Base Risk Weight</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={config.priorityWeights?.risk || 0.60}
                onChange={(e) => handleWeightChange('priorityWeights', 'risk', e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Environmental Risk Weight</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={config.priorityWeights?.environmental || 0.20}
                onChange={(e) => handleWeightChange('priorityWeights', 'environmental', e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Vulnerability Weight</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={config.priorityWeights?.vulnerability || 0.20}
                onChange={(e) => handleWeightChange('priorityWeights', 'vulnerability', e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Symptom Multipliers */}
        <div className="bg-white dark:bg-[#0c1f1c] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
            Symptom Severity Multipliers (Prototype Parameters)
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {['diarrhea', 'vomiting', 'dehydration', 'fever', 'abdominal_pain', 'other'].map(sym => (
              <div key={sym} className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize">{sym.replace('_', ' ')}</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="5"
                  value={config.symptomWeights?.[sym] || 1.0}
                  onChange={(e) => handleWeightChange('symptomWeights', sym, e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl text-xs text-amber-800 dark:text-amber-300">
          <p className="font-bold flex items-center gap-1.5 mb-0.5">
            <span>⚠️</span> Prototype Disclaimer
          </p>
          <p>
            All parameters above are public health surveillance prototype defaults — not clinically validated values. Every modification is logged to the system audit trail.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
        >
          {saving ? 'Applying & Invalidating Cache...' : '💾 Save & Apply Risk Configuration'}
        </button>
      </form>
    </div>
  );
}
