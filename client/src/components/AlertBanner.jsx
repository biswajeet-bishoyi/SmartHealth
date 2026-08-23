import React from 'react';

const AlertBanner = ({ alert, onClose }) => {
  if (!alert) return null;

  const riskLevel = alert.riskLevel || 'HIGH';

  const styles = {
    LOW: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100',
    MEDIUM: 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-950 dark:text-amber-100',
    HIGH: 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-950 dark:text-orange-100',
    CRITICAL: 'bg-rose-50 dark:bg-rose-950/50 border-rose-600 text-rose-950 dark:text-rose-100',
  };

  const badgeStyles = {
    LOW: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
    MEDIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700',
    CRITICAL: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700 animate-pulse',
  };

  const icons = {
    LOW: 'fa-solid fa-circle-info text-emerald-600 dark:text-emerald-400',
    MEDIUM: 'fa-solid fa-triangle-exclamation text-amber-600 dark:text-amber-400',
    HIGH: 'fa-solid fa-bell text-orange-600 dark:text-orange-400',
    CRITICAL: 'fa-solid fa-fire text-rose-600 dark:text-rose-400',
  };

  const formattedDate = alert.broadcastAt || alert.createdAt
    ? new Date(alert.broadcastAt || alert.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Live Broadcast';

  return (
    <div
      className={`rounded-2xl p-5 border-l-4 shadow-md transition-all animate-fadeIn ${
        styles[riskLevel] || styles.HIGH
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-lg shrink-0 shadow-sm border border-black/5 dark:border-white/10">
            <i className={icons[riskLevel] || 'fa-solid fa-triangle-exclamation text-orange-600'} />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-extrabold text-base tracking-tight font-headline">
                {alert.title}
              </h4>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${badgeStyles[riskLevel] || badgeStyles.HIGH}`}>
                {riskLevel}
              </span>
              {alert.status && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                  {alert.status}
                </span>
              )}
            </div>

            <p className="text-xs leading-relaxed opacity-95">
              {alert.message}
            </p>

            {(alert.village || alert.district) && (
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold opacity-90 pt-1">
                <span className="flex items-center gap-1.5">
                  <i className="fa-solid fa-location-dot text-rose-500" />
                  <span>{alert.village ? `${alert.village}, ` : ''}{alert.district || 'Northeast India'}</span>
                </span>
                <span className="flex items-center gap-1.5 opacity-75">
                  <i className="fa-solid fa-clock" />
                  <span>{formattedDate}</span>
                </span>
              </div>
            )}

            {alert.preventionActions && alert.preventionActions.length > 0 && (
              <div className="mt-3 text-xs bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-black/5 dark:border-white/10 shadow-sm">
                <span className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white mb-1.5">
                  <i className="fa-solid fa-shield-halved text-emerald-600 dark:text-emerald-400" />
                  Recommended Community Actions:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-200">
                  {alert.preventionActions.map((action, idx) => (
                    <li key={idx} className="leading-snug">{action}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 italic">
              * Official public health early warning signal • Non-diagnostic syndromic surveillance
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 text-lg leading-none transition-colors"
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
