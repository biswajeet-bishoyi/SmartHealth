import React, { useState } from 'react';

/**
 * DataQualityBadge
 * ----------------
 * Displays signal confidence (LOW / MEDIUM / HIGH) alongside risk scores.
 * Click opens a modal/popover with detailed reasons and metrics.
 */
export default function DataQualityBadge({ quality, compact = false }) {
  const [showModal, setShowModal] = useState(false);

  if (!quality) return null;

  const level = quality.confidenceLevel || 'MEDIUM';
  const colors = {
    HIGH: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700',
    LOW: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700',
  };

  const dotColors = {
    HIGH: 'bg-emerald-500',
    MEDIUM: 'bg-amber-500',
    LOW: 'bg-rose-500',
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        type="button"
        title="Click to view signal confidence details"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:scale-105 active:scale-95 cursor-pointer ${colors[level]}`}
      >
        <span className={`w-2 h-2 rounded-full animate-pulse ${dotColors[level]}`} />
        <span>Signal: {level}</span>
        {!compact && <i className="fa-solid fa-circle-info text-[10px] opacity-70" />}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0c1f1c] border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${dotColors[level]}`} />
                <h3 className="font-bold text-gray-900 dark:text-white">Signal Confidence Assessment</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl">
                <span className="text-xs text-gray-600 dark:text-gray-400">Confidence Level</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${colors[level]}`}>
                  {level} Confidence
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Factors & Reasons
                </h4>
                <ul className="space-y-1.5">
                  {(quality.reasons || ['Sufficient data available for this assessment.']).map((r, i) => (
                    <li key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-center">
                <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                  <p className="text-[10px] text-gray-500">Report Count</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{quality.reportCount ?? 0}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                  <p className="text-[10px] text-gray-500">30d Baseline</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{quality.historicalDataPoints ?? 0}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                  <p className="text-[10px] text-gray-500">Flagged Dupes</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{quality.flaggedDuplicates ?? 0}</p>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 dark:text-gray-500 italic">
                Signal confidence helps public health officers understand data sufficiency before making operational decisions.
              </p>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
