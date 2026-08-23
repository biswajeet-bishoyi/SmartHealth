import React, { useState, useEffect } from 'react';
import api from '../utils/axiosInstance';

export default function RiskExplanation({ assessmentId, predictionId, initialData }) {
  const [explanation, setExplanation] = useState(initialData || null);
  const [loading, setLoading] = useState(initialData ? false : (assessmentId || predictionId ? true : false));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setExplanation(initialData);
      setLoading(false);
      setError(null);
      return;
    }

    if (!assessmentId && !predictionId) {
      setLoading(false);
      return;
    }

    const fetchExplanation = async () => {
      try {
        setLoading(true);
        setError(null);
        let endpoint = '';
        if (assessmentId) endpoint = `/risk/${assessmentId}/explanation`;
        else if (predictionId) endpoint = `/predictions/${predictionId}/explanation`;

        const res = await api.get(endpoint);
        if (res.data?.success) {
          setExplanation(res.data.data);
        } else {
          setError(res.data?.message || 'Explanation unavailable');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load explanation');
      } finally {
        setLoading(false);
      }
    };

    fetchExplanation();
  }, [assessmentId, predictionId, initialData]);

  if (loading) {
    return (
      <div className="card p-6 animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-[#142c4a] rounded w-1/3" />
        <div className="h-3 bg-gray-200 dark:bg-[#142c4a] rounded w-2/3" />
        <div className="h-12 bg-gray-200 dark:bg-[#142c4a] rounded-xl w-full" />
      </div>
    );
  }

  if (error || !explanation) {
    return (
      <div className="card p-6 text-xs text-[#737780] space-y-2">
        <p className="font-bold text-[#0b1c30] dark:text-white flex items-center gap-1.5 font-headline">
          <i className="fa-solid fa-magnifying-glass-chart text-[#003366] dark:text-[#a7c8ff]" />
          <span>Explainable AI Breakdown</span>
        </p>
        <p>{error || 'Detailed component breakdown is being generated for this location...'}</p>
      </div>
    );
  }

  const { components = [], totalScore, level, village, district } = explanation;

  const levelColors = {
    LOW: 'text-[#006c49] dark:text-[#6cf8bb] bg-[#6cf8bb]/10 border-[#006c49]/30',
    MEDIUM: 'text-[#d97706] dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
    HIGH: 'text-[#ba1a1a] dark:text-rose-400 bg-[#ba1a1a]/10 border-[#ba1a1a]/30',
    CRITICAL: 'text-[#ba1a1a] dark:text-rose-400 bg-[#ffdad6] dark:bg-rose-950/60 border-[#ba1a1a]/40 font-extrabold',
  };

  return (
    <div className="card p-6 shadow-sm space-y-5 animate-fadeIn border border-[#e2e8f0] dark:border-[#1f3c60]">
      <div className="flex items-center justify-between border-b border-[#e2e8f0] dark:border-[#1f3c60] pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-magnifying-glass-chart text-[#003366] dark:text-[#a7c8ff]" />
            <h3 className="text-sm font-extrabold text-[#0b1c30] dark:text-white font-headline">
              Explainable Risk Score Breakdown
            </h3>
          </div>
          {village && (
            <p className="text-xs text-[#737780] mt-0.5 font-medium">
              {village}, {district}
            </p>
          )}
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${levelColors[level] || ''}`}>
          Score: {totalScore} ({level})
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-3 bg-[#e5eeff] dark:bg-[#142c4a] rounded-xl border border-[#799dd6]/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#001e40] dark:text-[#a7c8ff]">Mathematical Model:</span>
            <span className="font-mono text-[11px] text-gray-700 dark:text-gray-300">
              40% Symptoms + 25% Growth + 20% Water + 15% Clusters
            </span>
          </div>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            = {totalScore}/100 Total
          </span>
        </div>

        {components.map((comp, idx) => {
          const maxContrib = [40, 25, 20, 15][idx] || 40;
          const percent = Math.min(100, Math.max(8, (Math.abs(comp.contribution || 0) / maxContrib) * 100));

          const barColors = [
            'bg-rose-500 dark:bg-rose-400',
            'bg-amber-500 dark:bg-amber-400',
            'bg-cyan-500 dark:bg-cyan-400',
            'bg-indigo-500 dark:bg-indigo-400',
          ];

          return (
            <div key={idx} className="space-y-1.5 p-3 rounded-xl bg-gray-50 dark:bg-[#061324] border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0b1c30] dark:text-[#eaf1ff]">
                  {comp.label}
                </span>
                <span className="font-extrabold text-[#001e40] dark:text-[#a7c8ff] font-mono">
                  +{comp.contribution || 0} pts
                  <span className="text-[10px] text-[#737780] ml-1 font-normal">
                    (Weight: {idx === 0 ? '40%' : idx === 1 ? '25%' : idx === 2 ? '20%' : '15%'} • Raw: {comp.rawValue}/100)
                  </span>
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-200 dark:bg-[#142c4a] rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColors[idx] || 'bg-emerald-500'} rounded-full transition-all duration-500`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#eff4ff] dark:bg-[#142c4a]/50 border border-[#003366]/30 rounded-xl p-3.5 text-[11px] text-[#001e40] dark:text-[#cbdbf5]">
        <p className="font-bold flex items-center gap-1.5 mb-1 text-[#001e40] dark:text-white font-headline">
          <i className="fa-solid fa-calculator text-emerald-600" />
          <span>Real-Time Deterministic Provenance</span>
        </p>
        <p className="leading-relaxed">
          Each score contribution is calculated automatically from active syndromic reports, water field test data, and geographical spatial cluster velocity. Real-time updates sync dynamically across all surveillance screens.
        </p>
      </div>
    </div>
  );
}
