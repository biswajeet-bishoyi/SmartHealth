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

      <div className="space-y-3.5">
        {components.map((comp, idx) => {
          const maxContrib = 40;
          const percent = Math.min(100, Math.max(8, (Math.abs(comp.contribution || 0) / maxContrib) * 100));

          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#0b1c30] dark:text-[#eaf1ff]">
                  {comp.label}
                </span>
                <span className="font-bold text-[#001e40] dark:text-[#a7c8ff]">
                  +{comp.contribution || 0} pts
                  {comp.rawValue !== undefined && (
                    <span className="text-[10px] text-[#737780] ml-1 font-normal">
                      (raw: {comp.rawValue})
                    </span>
                  )}
                </span>
              </div>
              <div className="w-full h-2 bg-[#e5eeff] dark:bg-[#142c4a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#006c49] dark:bg-[#6cf8bb] rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#eff4ff] dark:bg-[#142c4a]/50 border border-[#003366]/30 rounded-xl p-3.5 text-[11px] text-[#001e40] dark:text-[#cbdbf5]">
        <p className="font-bold flex items-center gap-1.5 mb-1 text-[#001e40] dark:text-white font-headline">
          <i className="fa-solid fa-triangle-exclamation text-amber-500" />
          <span>Public Health Prototype Disclaimer</span>
        </p>
        <p className="leading-relaxed">
          Score contributions are derived deterministically from the prototype risk formula. This is an operational monitoring tool, not a clinical diagnosis or medically validated decision system.
        </p>
      </div>
    </div>
  );
}
