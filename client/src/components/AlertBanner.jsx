import React from 'react';

const AlertBanner = ({ alert, onClose }) => {
  if (!alert) return null;

  const styles = {
    LOW: 'bg-green-50 border-green-500 text-green-900',
    MEDIUM: 'bg-yellow-50 border-yellow-500 text-yellow-900',
    HIGH: 'bg-orange-50 border-orange-500 text-orange-900',
    CRITICAL: 'bg-red-50 border-red-500 text-red-900',
  };

  const icons = {
    LOW: 'fa-solid fa-circle-info text-emerald-600',
    MEDIUM: 'fa-solid fa-triangle-exclamation text-amber-600',
    HIGH: 'fa-solid fa-bell text-orange-600',
    CRITICAL: 'fa-solid fa-fire text-rose-600',
  };

  return (
    <div
      className={`rounded-xl p-4 border-l-4 shadow-sm mb-4 transition-all ${
        styles[alert.riskLevel] || styles.HIGH
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center text-base shrink-0 shadow-sm">
            <i className={icons[alert.riskLevel] || 'fa-solid fa-triangle-exclamation text-orange-600'} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-base">{alert.title}</h4>
              <span className="text-xs px-2 py-0.5 rounded bg-white bg-opacity-60 font-semibold border">
                {alert.riskLevel}
              </span>
            </div>
            <p className="text-sm opacity-90 mb-2">{alert.message}</p>

            {alert.village && (
              <p className="text-xs font-medium opacity-75 mb-2 flex items-center gap-1">
                <i className="fa-solid fa-location-dot" />
                <span>Location: {alert.village}, {alert.district}</span>
              </p>
            )}

            {alert.preventionActions && alert.preventionActions.length > 0 && (
              <div className="mt-2 text-xs bg-white bg-opacity-70 p-2.5 rounded-lg border border-opacity-20">
                <span className="font-bold block mb-1">Recommended Preventive Actions:</span>
                <ul className="list-disc list-inside space-y-0.5 opacity-90">
                  {alert.preventionActions.map((action, idx) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-[10px] text-gray-500 mt-2 italic">
              * This alert is an indicator for public-health awareness. It is not a medical diagnosis.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 text-lg leading-none"
            title="Dismiss"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default AlertBanner;
