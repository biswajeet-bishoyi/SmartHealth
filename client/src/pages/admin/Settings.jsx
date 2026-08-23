import React from 'react';

const Settings = () => {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">System & Risk Engine Configuration</h1>
        <p className="text-xs text-slate-400">View and adjust prototype public-health monitoring parameters</p>
      </div>

      <div className="card bg-slate-950 border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-200">Risk Calculation Formula Parameters</h3>
        <p className="text-xs text-slate-400">
          Formula: <code className="text-purple-400 font-mono">riskScore = symptom*0.40 + growth*0.25 + water*0.20 + cluster*0.15</code>
        </p>

        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div>Symptom Weight: <b className="text-purple-300">40%</b></div>
          <div>Growth Weight: <b className="text-purple-300">25%</b></div>
          <div>Water Weight: <b className="text-purple-300">20%</b></div>
          <div>Cluster Weight: <b className="text-purple-300">15%</b></div>
        </div>

        <h3 className="text-sm font-bold text-slate-200 pt-3">Risk Level Threshold Boundaries</h3>
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
          <div className="p-3 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            LOW<br /><span className="text-[10px] font-normal">0 – 30</span>
          </div>
          <div className="p-3 rounded bg-amber-950 text-amber-300 border border-amber-800">
            MEDIUM<br /><span className="text-[10px] font-normal">31 – 60</span>
          </div>
          <div className="p-3 rounded bg-orange-950 text-orange-300 border border-orange-800">
            HIGH<br /><span className="text-[10px] font-normal">61 – 80</span>
          </div>
          <div className="p-3 rounded bg-red-950 text-red-300 border border-red-800">
            CRITICAL<br /><span className="text-[10px] font-normal">81 – 100</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
