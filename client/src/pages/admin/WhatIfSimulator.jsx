import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosInstance';
import RiskBadge from '../../components/RiskBadge';

export default function WhatIfSimulator() {
  const [villages, setVillages] = useState([]);
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [baselineAssessment, setBaselineAssessment] = useState(null);

  // Simulation inputs
  const [inputs, setInputs] = useState({
    additionalDiarrheaReports: 5,
    additionalVomitingReports: 3,
    additionalFeverReports: 2,
    additionalAffectedPeople: 4,
    waterContaminationConfirmed: true,
    rainfallSpike: true,
    customNote: 'Hypothetical post-flood surge simulation',
  });

  const [running, setRunning] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [pastSimulations, setPastSimulations] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchVillages = async () => {
      try {
        const res = await api.get('/risk');
        if (res.data?.success) {
          const list = res.data.data.assessments || [];
          setVillages(list);
          if (list.length > 0) {
            setSelectedVillage(list[0].village);
            setSelectedDistrict(list[0].district);
            setBaselineAssessment(list[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load villages for simulation:', err);
      }
    };
    fetchVillages();
    fetchPastSimulations();
  }, []);

  const fetchPastSimulations = async () => {
    try {
      const res = await api.get('/simulations?limit=5');
      if (res.data?.success) {
        setPastSimulations(res.data.data.simulations || []);
      }
    } catch (err) {
      console.error('Failed to fetch past simulations:', err);
    }
  };

  const handleVillageChange = (e) => {
    const vName = e.target.value;
    setSelectedVillage(vName);
    const found = villages.find(v => v.village === vName);
    if (found) {
      setSelectedDistrict(found.district);
      setBaselineAssessment(found);
      setSimResult(null);
    }
  };

  const handleRunSimulation = async (e) => {
    e.preventDefault();
    if (!selectedVillage || !selectedDistrict) return;

    try {
      setRunning(true);
      setErrorMsg(null);
      const res = await api.post('/simulations', {
        village: selectedVillage,
        district: selectedDistrict,
        state: baselineAssessment?.state || 'Assam',
        inputs,
      });

      if (res.data?.success) {
        setSimResult(res.data.data);
        fetchPastSimulations();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Simulation failed to run');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e2e8f0] dark:border-[#1f3c60] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-[#e5eeff] dark:bg-[#142c4a] text-[#001e40] dark:text-[#a7c8ff] flex items-center justify-center text-base">
              <i className="fa-solid fa-flask-vial" />
            </span>
            <h1 className="text-2xl font-extrabold text-[#0b1c30] dark:text-white font-headline tracking-tight">
              What-If Outbreak Scenario Simulator
            </h1>
          </div>
          <p className="text-xs text-[#737780] mt-1">
            Sandbox testing: Simulate how environmental events and report spikes affect risk scores without altering production data.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-[#001e40] text-[#a7c8ff] text-xs font-bold self-start md:self-auto flex items-center gap-2 border border-[#003366]">
          <span className="w-2 h-2 rounded-full bg-[#6cf8bb] animate-pulse" />
          <span>In-Memory Sandbox Isolated</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-[#ffdad6] dark:bg-rose-950/40 border border-[#ba1a1a]/30 rounded-xl text-xs text-[#93000a] dark:text-rose-200">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Parameter Controls */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleRunSimulation} className="card space-y-5 border-t-4 border-t-[#001e40]">
            <h3 className="text-sm font-bold text-[#0b1c30] dark:text-white flex items-center gap-2 font-headline">
              <i className="fa-solid fa-sliders text-[#001e40] dark:text-[#a7c8ff]" />
              <span>Simulation Parameters</span>
            </h3>

            {/* Location Selector */}
            <div className="space-y-1.5">
              <label className="form-label">
                TARGET VILLAGE BASELINE
              </label>
              <select
                value={selectedVillage}
                onChange={handleVillageChange}
                className="form-select text-xs font-semibold"
              >
                {villages.map(v => (
                  <option key={v._id || v.village} value={v.village}>
                    {v.village} ({v.district}) — Current Risk: {v.riskScore}/100 ({v.riskLevel})
                  </option>
                ))}
              </select>
            </div>

            {/* Sliders for Hypothetical Symptom Reports */}
            <div className="space-y-4 pt-2 border-t border-[#e2e8f0] dark:border-[#1f3c60]">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#0b1c30] dark:text-white">Additional Diarrhea Reports</span>
                  <span className="text-[#001e40] dark:text-[#a7c8ff] font-bold">+{inputs.additionalDiarrheaReports}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={inputs.additionalDiarrheaReports}
                  onChange={(e) => setInputs({ ...inputs, additionalDiarrheaReports: +e.target.value })}
                  className="w-full accent-[#001e40]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#0b1c30] dark:text-white">Additional Vomiting Reports</span>
                  <span className="text-[#001e40] dark:text-[#a7c8ff] font-bold">+{inputs.additionalVomitingReports}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={inputs.additionalVomitingReports}
                  onChange={(e) => setInputs({ ...inputs, additionalVomitingReports: +e.target.value })}
                  className="w-full accent-[#001e40]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#0b1c30] dark:text-white">Additional Fever Reports</span>
                  <span className="text-[#001e40] dark:text-[#a7c8ff] font-bold">+{inputs.additionalFeverReports}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={inputs.additionalFeverReports}
                  onChange={(e) => setInputs({ ...inputs, additionalFeverReports: +e.target.value })}
                  className="w-full accent-[#001e40]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#0b1c30] dark:text-white">Avg Affected People Per Report</span>
                  <span className="text-[#001e40] dark:text-[#a7c8ff] font-bold">{inputs.additionalAffectedPeople} people</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={inputs.additionalAffectedPeople}
                  onChange={(e) => setInputs({ ...inputs, additionalAffectedPeople: +e.target.value })}
                  className="w-full accent-[#001e40]"
                />
              </div>
            </div>

            {/* Environmental & Water Toggles */}
            <div className="space-y-3 pt-2 border-t border-[#e2e8f0] dark:border-[#1f3c60]">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-[#c3c6d1] dark:border-[#1f3c60] bg-[#f8f9ff] dark:bg-[#061324] cursor-pointer">
                <input
                  type="checkbox"
                  checked={inputs.waterContaminationConfirmed}
                  onChange={(e) => setInputs({ ...inputs, waterContaminationConfirmed: e.target.checked })}
                  className="w-4 h-4 rounded text-[#001e40] accent-[#001e40]"
                />
                <div>
                  <p className="text-xs font-bold text-[#0b1c30] dark:text-white">Water Contamination Confirmed</p>
                  <p className="text-[10px] text-[#737780]">Simulate a high-severity water source contamination event</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-[#c3c6d1] dark:border-[#1f3c60] bg-[#f8f9ff] dark:bg-[#061324] cursor-pointer">
                <input
                  type="checkbox"
                  checked={inputs.rainfallSpike}
                  onChange={(e) => setInputs({ ...inputs, rainfallSpike: e.target.checked })}
                  className="w-4 h-4 rounded text-[#001e40] accent-[#001e40]"
                />
                <div>
                  <p className="text-xs font-bold text-[#0b1c30] dark:text-white">Monsoon Flood / Rainfall Spike</p>
                  <p className="text-[10px] text-[#737780]">Simulate heavy monsoon flooding affecting local water bodies</p>
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={running}
              className="w-full btn btn-primary py-3 text-xs font-black uppercase tracking-wider"
            >
              {running ? 'Running Risk Simulator Model...' : '▶ Execute What-If Scenario'}
            </button>
          </form>
        </div>

        {/* Right Column: Comparison & Results */}
        <div className="lg:col-span-7 space-y-6">
          {simResult ? (
            <div className="card space-y-6 border-2 border-[#003366] shadow-xl animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] dark:border-[#1f3c60] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-chart-simple text-[#003366] dark:text-[#a7c8ff]" />
                    <h3 className="text-base font-extrabold text-[#0b1c30] dark:text-white font-headline">
                      Scenario Projection for {simResult.village}
                    </h3>
                  </div>
                  <p className="text-xs text-[#737780] mt-0.5">
                    Isolated sandbox projection using identical risk engine algorithms
                  </p>
                </div>
                <span className="px-3 py-1 bg-[#001e40] text-[#a7c8ff] text-xs font-black rounded-md uppercase font-mono">
                  SIMULATION
                </span>
              </div>

              {/* Score Comparison Cards */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-[#f8f9ff] dark:bg-[#061324] rounded-xl border border-[#e2e8f0] dark:border-[#1f3c60]">
                  <p className="text-[11px] font-bold uppercase text-[#737780]">Current Baseline</p>
                  <p className="text-3xl font-extrabold text-[#0b1c30] dark:text-white mt-1 font-headline">
                    {simResult.baselineRiskScore}
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {simResult.baselineRiskLevel}
                  </span>
                </div>

                <div className="p-4 bg-[#eff4ff] dark:bg-[#142c4a]/40 rounded-xl border border-[#003366]/30">
                  <p className="text-[11px] font-bold uppercase text-[#003366] dark:text-[#a7c8ff]">Simulated Projection</p>
                  <p className="text-3xl font-extrabold text-[#001e40] dark:text-[#a7c8ff] mt-1 font-headline">
                    {simResult.projectedRiskScore}
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-[#003366] text-[#a7c8ff]">
                    {simResult.projectedRiskLevel}
                  </span>
                </div>

                <div className="p-4 bg-[#ffdad6] dark:bg-rose-950/30 rounded-xl border border-[#ba1a1a]/30">
                  <p className="text-[11px] font-bold uppercase text-[#ba1a1a]">Score Surge Delta</p>
                  <p className="text-3xl font-extrabold text-[#ba1a1a] mt-1 font-headline">
                    +{simResult.scoreDelta}
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-[#ba1a1a] text-white">
                    +{Math.round((simResult.scoreDelta / Math.max(1, simResult.baselineRiskScore)) * 100)}% Surge
                  </span>
                </div>
              </div>

              {/* Component Change Explanation */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#737780]">
                  Projected Contributing Factors
                </h4>
                <div className="space-y-2">
                  {(simResult.explanation || []).map((exp, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-[#f8f9ff] dark:bg-[#061324] rounded-lg text-xs border border-[#e2e8f0] dark:border-[#1f3c60]">
                      <div>
                        <span className="font-bold text-[#0b1c30] dark:text-white">{exp.label}</span>
                        <span className="text-[10px] text-[#737780] ml-2">
                          (from {exp.baselineValue} to {exp.simulatedValue})
                        </span>
                      </div>
                      <span className="font-extrabold text-[#001e40] dark:text-[#a7c8ff]">
                        +{exp.contribution} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#e5eeff] dark:bg-[#142c4a] text-[#001e40] dark:text-[#a7c8ff] flex items-center justify-center text-3xl mx-auto">
                <i className="fa-solid fa-flask-vial" />
              </div>
              <h3 className="font-bold text-base text-[#0b1c30] dark:text-white font-headline">Ready for Scenario Testing</h3>
              <p className="text-xs text-[#737780] max-w-md mx-auto">
                Select a target village on the left, adjust symptom spikes or flood parameters, and click <b>Execute What-If Scenario</b> to generate risk projections.
              </p>
            </div>
          )}

          {/* Past Simulations History */}
          {pastSimulations.length > 0 && (
            <div className="card space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#737780]">
                Recent Simulation Runs
              </h4>
              <div className="divide-y divide-[#e2e8f0] dark:divide-[#1f3c60]">
                {pastSimulations.map((sim, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#0b1c30] dark:text-white">{sim.village}</span>
                      <span className="text-[#737780] text-[10px] ml-2 font-mono">
                        {new Date(sim.runAt || sim.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#737780]">{sim.baselineRiskScore} →</span>
                      <span className="font-bold text-[#001e40] dark:text-[#a7c8ff]">{sim.projectedRiskScore}</span>
                      <span className="text-[10px] font-bold text-[#ba1a1a]">(+{sim.scoreDelta})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
