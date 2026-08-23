import React from 'react';

const RiskBadge = ({ level = 'LOW', score }) => {
  const styles = {
    LOW: 'bg-green-100 text-green-800 border-green-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
    CRITICAL: 'bg-red-100 text-red-800 border-red-200 animate-pulse',
  };

  const labels = {
    LOW: 'Low Risk',
    MEDIUM: 'Medium Risk',
    HIGH: 'High Risk',
    CRITICAL: 'Critical Risk',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
        styles[level] || styles.LOW
      }`}
      title="Public-health monitoring indicator only — not a medical diagnosis"
    >
      <span
        className={`w-2 h-2 rounded-full ${
          level === 'LOW'
            ? 'bg-green-500'
            : level === 'MEDIUM'
            ? 'bg-yellow-500'
            : level === 'HIGH'
            ? 'bg-orange-500'
            : 'bg-red-500'
        }`}
      />
      {labels[level] || level}
      {score !== undefined && <span className="opacity-75">({score}/100)</span>}
    </span>
  );
};

export default RiskBadge;
