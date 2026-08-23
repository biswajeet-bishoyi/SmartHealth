import React from 'react';

const StatCard = ({ title, value, icon, subtitle, color = 'brand', loading = false }) => {
  const colorStyles = {
    brand: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    yellow: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className="card flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        {loading ? (
          <div className="h-8 w-16 skeleton mt-2"></div>
        ) : (
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        )}
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {icon && (
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl border ${
            colorStyles[color] || colorStyles.brand
          }`}
        >
          {icon}
        </div>
      )}
    </div>
  );
};

export default StatCard;
