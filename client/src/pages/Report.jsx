import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../utils/axiosInstance';
import VoiceReporter from '../components/VoiceReporter';
import { NORTHEAST_STATES, getDistricts, getVillages } from '../data/locationData';

const CLINICAL_SIGNS = [
  { id: 'diarrhea', label: 'Diarrhea', iconClass: 'fa-solid fa-droplet text-blue-500' },
  { id: 'vomiting', label: 'Vomiting', iconClass: 'fa-solid fa-face-dizzy text-emerald-500' },
  { id: 'fever', label: 'Fever', iconClass: 'fa-solid fa-temperature-high text-rose-500' },
  { id: 'abdominal_pain', label: 'Stomach Pain', iconClass: 'fa-solid fa-bolt text-amber-500' },
  { id: 'dehydration', label: 'Dehydration', iconClass: 'fa-solid fa-glass-water-droplet text-cyan-500' },
  { id: 'skin_rash', label: 'Skin Rash', iconClass: 'fa-solid fa-hand-dots text-purple-500' },
  { id: 'fatigue', label: 'Fatigue', iconClass: 'fa-solid fa-bed text-orange-500' },
];

const WATER_SOURCES = [
  { id: 'river', label: 'River', iconClass: 'fa-solid fa-water text-blue-500' },
  { id: 'community_well', label: 'Community Well', iconClass: 'fa-solid fa-bore-hole text-cyan-600' },
  { id: 'tap_water', label: 'Tap Water', iconClass: 'fa-solid fa-faucet-drip text-teal-500' },
  { id: 'well', label: 'Well', iconClass: 'fa-solid fa-circle-dot text-indigo-500' },
  { id: 'pond', label: 'Pond', iconClass: 'fa-solid fa-cloud-rain text-cyan-500' },
  { id: 'other', label: 'Other', iconClass: 'fa-solid fa-location-crosshairs text-gray-500' },
];

export default function Report() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [stateRegion, setStateRegion] = useState(user?.state || 'Assam');
  const [district, setDistrict] = useState(user?.district || 'Kamrup');
  const [villageSector, setVillageSector] = useState(user?.village || 'Majuli Village');
  const [villageSearch, setVillageSearch] = useState('');
  const [selectedSigns, setSelectedSigns] = useState(['diarrhea', 'vomiting']);
  const [affectedPeople, setAffectedPeople] = useState(2);
  const [duration, setDuration] = useState(2);
  const [selectedSources, setSelectedSources] = useState(['community_well']);
  const [sourceChannel, setSourceChannel] = useState('APP');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Available districts for the selected state
  const availableDistricts = useMemo(() => getDistricts(stateRegion), [stateRegion]);

  // District options ensure current selected value is present
  const districtOptions = useMemo(() => {
    const list = [...availableDistricts];
    if (district && !list.includes(district)) {
      list.unshift(district);
    }
    return list;
  }, [availableDistricts, district]);

  // Available villages for current state and district
  const availableVillages = useMemo(() => getVillages(stateRegion, district), [stateRegion, district]);

  // Village options ensure current selected value is present
  const villageOptions = useMemo(() => {
    const list = [...availableVillages];
    if (villageSector && !list.includes(villageSector)) {
      list.unshift(villageSector);
    }
    return list;
  }, [availableVillages, villageSector]);

  const handleStateChange = (newState) => {
    setStateRegion(newState);
    const newDistricts = getDistricts(newState);
    const nextDistrict = newDistricts.length > 0 ? newDistricts[0] : '';
    setDistrict(nextDistrict);
    const newVillages = getVillages(newState, nextDistrict);
    const nextVillage = newVillages.length > 0 ? newVillages[0] : '';
    setVillageSector(nextVillage);
    setVillageSearch('');
  };

  const handleDistrictChange = (newDistrict) => {
    setDistrict(newDistrict);
    const newVillages = getVillages(stateRegion, newDistrict);
    const nextVillage = newVillages.length > 0 ? newVillages[0] : '';
    setVillageSector(nextVillage);
    setVillageSearch('');
  };

  // Consume voiceData passed via navigation
  useEffect(() => {
    if (location.state?.voiceData) {
      const v = location.state.voiceData;
      if (v.symptoms && v.symptoms.length > 0) setSelectedSigns(v.symptoms);
      if (v.affectedPeople) setAffectedPeople(v.affectedPeople);
      if (v.duration) setDuration(v.duration);
      if (v.transcript) setVoiceTranscript(v.transcript);
      if (v.village) setVillageSector(v.village);
      if (v.district) setDistrict(v.district);
      if (v.waterSources && v.waterSources.length > 0) setSelectedSources(v.waterSources);
      else if (v.waterSource) setSelectedSources([v.waterSource]);
      setSourceChannel('VOICE');
    }
  }, [location.state]);

  const toggleSign = (signId) => {
    setSelectedSigns((prev) =>
      prev.includes(signId) ? prev.filter((s) => s !== signId) : [...prev, signId]
    );
  };

  const toggleWaterSource = (sourceId) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId)
        ? (prev.length > 1 ? prev.filter((s) => s !== sourceId) : prev)
        : [...prev, sourceId]
    );
  };

  const handleVoiceExtracted = (data) => {
    if (data?.submittedDirect) {
      navigate('/');
      return;
    }
    if (data.symptoms && data.symptoms.length > 0) {
      setSelectedSigns(data.symptoms);
    }
    if (data.affectedPeople) {
      setAffectedPeople(data.affectedPeople);
    }
    if (data.duration) {
      setDuration(data.duration);
    }
    if (data.transcript) {
      setVoiceTranscript(data.transcript);
    }
    if (data.village) {
      setVillageSector(data.village);
    }
    if (data.waterSources && data.waterSources.length > 0) {
      setSelectedSources(data.waterSources);
    } else if (data.waterSource) {
      setSelectedSources([data.waterSource]);
    }
    setSourceChannel('VOICE');
    setShowVoiceModal(false);
  };

  const [submittedReportData, setSubmittedReportData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (selectedSigns.length === 0) {
      setErrorMsg('Please select at least one clinical sign/symptom.');
      return;
    }
    if (selectedSources.length === 0) {
      setErrorMsg('Please select at least one water source.');
      return;
    }
    if (!district || !villageSector) {
      setErrorMsg('District and Village are required.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        village: villageSector,
        district: district,
        state: stateRegion,
        symptoms: selectedSigns,
        affectedPeople: Number(affectedPeople) || 1,
        affectedCount: Number(affectedPeople) || 1,
        duration: Number(duration) || 1,
        durationDays: Number(duration) || 1,
        waterSource: selectedSources[0],
        waterSources: selectedSources,
        sourceChannel,
        description: voiceTranscript ? `Voice report transcript: "${voiceTranscript}"` : undefined,
        voiceTranscript: voiceTranscript || undefined,
        notes: voiceTranscript ? `Voice report transcript: "${voiceTranscript}"` : undefined,
      };

      const res = await api.post('/reports', payload);
      if (res.data?.success) {
        const createdReport = res.data.data?.report || {};
        const submissionDate = new Date();
        const formattedTimestamp = submissionDate.toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        setSubmittedReportData({
          reportId: createdReport._id || createdReport.reportId || `NE-SRV-${Date.now().toString().slice(-6)}`,
          timestamp: formattedTimestamp,
          village: villageSector,
          district: district,
          state: stateRegion,
          symptoms: selectedSigns,
          affectedPeople: Number(affectedPeople) || 1,
          duration: Number(duration) || 1,
          waterSources: selectedSources,
          sourceChannel,
          dispatchedTo: {
            phc: `Primary Health Centre (PHC ${villageSector}) / BPHC ${district}`,
            officer: 'Dr. Priya Sharma (Medical Officer - Community Health)',
            unit: `District Surveillance Unit (IDSP ${district}) & State Health Mission ${stateRegion}`,
          },
        });
        setSubmitted(true);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit health report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-8 animate-fadeIn">
      {submitted && submittedReportData ? (
        <div className="max-w-3xl mx-auto card p-8 sm:p-10 space-y-8 border-2 border-[#003366] shadow-2xl animate-scaleIn">
          {/* Header */}
          <div className="text-center space-y-3 border-b border-[#e2e8f0] dark:border-[#1f3c60] pb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-600/30">
              <i className="fa-solid fa-circle-check" />
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-mono font-bold border border-emerald-300">
              REF ID: {submittedReportData.reportId}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0b1c30] dark:text-white font-headline">
              Incident Report Dispatched Successfully
            </h2>
            <p className="text-xs text-[#737780] dark:text-[#94a3b8] max-w-lg mx-auto">
              Your syndromic observation has been logged into the Northeast Public Health Sentinel network with full cryptographic provenance.
            </p>
          </div>

          {/* Submission Timestamp & Dispatched Authorities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#061324] border border-gray-200 dark:border-[#1f3c60] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <i className="fa-solid fa-clock text-[#003366] dark:text-[#a7c8ff]" />
                <span>Exact Timestamp</span>
              </div>
              <p className="text-sm font-extrabold text-gray-900 dark:text-white font-mono">
                {submittedReportData.timestamp}
              </p>
              <div className="text-[11px] text-gray-500">
                Channel: <span className="font-bold text-[#003366] dark:text-[#a7c8ff] font-mono">{submittedReportData.sourceChannel}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#eff4ff] dark:bg-[#142c4a] border border-[#799dd6]/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#003366] dark:text-[#a7c8ff] uppercase tracking-wider">
                <i className="fa-solid fa-hospital-user text-emerald-600" />
                <span>Submitted & Dispatched To</span>
              </div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {submittedReportData.dispatchedTo.phc}
              </p>
              <p className="text-[11px] text-gray-700 dark:text-gray-300">
                👨‍⚕️ <b>Assigned Officer:</b> {submittedReportData.dispatchedTo.officer}
              </p>
              <p className="text-[10px] text-gray-500">
                🏛️ {submittedReportData.dispatchedTo.unit}
              </p>
            </div>
          </div>

          {/* ─── Live Report Tracking Route (Triage Pipeline Stepper) ──────────── */}
          <div className="space-y-4 bg-gray-50/70 dark:bg-[#0c1f1c] p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-route text-emerald-600" />
                <span>Live Report Tracking Route</span>
              </h3>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 px-2.5 py-0.5 rounded-full border border-amber-300">
                Stage 2 of 4 • In Active Triage
              </span>
            </div>

            {/* Stepper Line */}
            <div className="space-y-4 pt-2">
              {/* Step 1 */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm shrink-0 shadow-sm">
                  <i className="fa-solid fa-check" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                      1. Incident Logged & Timestamped
                    </h4>
                    <span className="text-[10px] text-emerald-600 font-bold">Completed</span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Observation stored securely with GPS coordinates ({submittedReportData.village}, {submittedReportData.district}).
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm shrink-0 shadow-md animate-pulse">
                  <i className="fa-solid fa-spinner animate-spin" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      2. Dispatched to ASHA & Medical Officer Queue
                    </h4>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-extrabold bg-amber-100 dark:bg-amber-950 px-2 py-0.2 rounded">
                      In Progress
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300">
                    Received by Dr. Priya Sharma for clinical verification and priority ranking.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3.5 opacity-60">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-xs shrink-0">
                  3
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    3. Ground Reality Verification & Water Sample Test
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Field inspection team checks water sources ({submittedReportData.waterSources?.join(', ')}) with Jal Jeevan Mission Field Test Kits.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3.5 opacity-60">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-xs shrink-0">
                  4
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    4. Risk Engine Assessment & Early Warning Advisory
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Surveillance engine calculates localized risk score and triggers automated boiling advisories if threshold exceeds.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Incident Summary Box */}
          <div className="p-4 rounded-xl bg-gray-100 dark:bg-[#142c4a]/40 text-xs space-y-2 border border-gray-200 dark:border-gray-800">
            <h4 className="font-extrabold text-gray-900 dark:text-white uppercase tracking-wider text-[11px]">
              📋 Reported Observation Summary
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>Location: <b>{submittedReportData.village}, {submittedReportData.district}</b></div>
              <div>Affected: <b>{submittedReportData.affectedPeople} People</b></div>
              <div>Duration: <b>{submittedReportData.duration} Days</b></div>
              <div>Water: <b>{submittedReportData.waterSources?.join(', ')}</b></div>
            </div>
            <div className="text-[11px] pt-1">
              Symptoms Reported: <span className="font-bold text-rose-700 dark:text-rose-300">{submittedReportData.symptoms?.join(', ')}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setSubmittedReportData(null);
              }}
              className="w-full sm:w-auto btn btn-secondary text-xs py-3 px-5 font-bold"
            >
              + File Another Observation
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate('/community/history')}
                className="flex-1 sm:flex-none btn bg-[#003366] text-white hover:bg-[#002850] text-xs py-3 px-5 font-bold shadow-md"
              >
                Track in My History →
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 sm:flex-none btn btn-primary text-xs py-3 px-6 font-bold shadow-md"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ─── Left Panel: Institutional Sentinel Info Card ─────────────────── */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div className="rounded-2xl p-7 bg-[#001e40] text-white border border-[#003366] shadow-xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#003366] text-[#a7c8ff] border border-[#799dd6]/30 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#6cf8bb] animate-pulse" />
                COMMUNITY SURVEILLANCE
              </div>

              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-white font-headline">
                  Report Symptoms
                </h2>
                <p className="text-xs text-[#cbdbf5] mt-2 leading-relaxed">
                  Community reports enable early warning detection and rapid public health response across rural Northeast India.
                </p>
              </div>

              {/* Voice Reporting Quick Launch Button */}
              <button
                type="button"
                onClick={() => setShowVoiceModal(true)}
                className="w-full py-3.5 px-4 bg-[#003366] hover:bg-[#004080] border border-[#799dd6]/40 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition transform active:scale-95 cursor-pointer"
              >
                <i className="fa-solid fa-microphone-lines" />
                <span>Report via Voice Assistant</span>
              </button>

              {/* Channel Indicator */}
              <div className="p-3.5 rounded-xl bg-[#00142b] border border-[#003366] space-y-1.5">
                <div className="flex items-center justify-between text-[#a7c8ff] font-bold text-xs">
                  <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-tower-broadcast" />
                    <span>Channel:</span>
                  </span>
                  <span className="font-mono bg-[#003366] px-2 py-0.5 rounded text-[10px] text-white border border-[#799dd6]/30">
                    {sourceChannel}
                  </span>
                </div>
                <p className="text-[10px] text-[#737780]">
                  Idempotent sync protected — reports are logged with full provenance.
                </p>
              </div>
            </div>
          </div>

          {/* ─── Right Panel: Form ──────────────────────────────── */}
          <div className="lg:col-span-8 card p-8 space-y-8">
            {showVoiceModal && (
              <VoiceReporter
                onExtractedData={handleVoiceExtracted}
                onCancel={() => setShowVoiceModal(false)}
              />
            )}

            {voiceTranscript && (
              <div className="p-4 rounded-xl bg-[#e5eeff] dark:bg-[#142c4a] border-2 border-[#003366] text-xs space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#001e40] dark:text-white flex items-center gap-1.5 font-headline">
                    <i className="fa-solid fa-microphone-lines text-[#006c49] dark:text-[#6cf8bb]" />
                    <span>Voice Observation Loaded</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceTranscript('');
                      setSourceChannel('APP');
                    }}
                    className="text-[10px] text-[#ba1a1a] hover:underline font-bold"
                  >
                    Clear Voice Data
                  </button>
                </div>
                <p className="text-[#0b1c30] dark:text-[#cbdbf5] italic font-medium">
                  "{voiceTranscript}"
                </p>
                <p className="text-[10px] text-[#737780]">
                  Form fields below have been pre-filled from this voice input. Review and click "Submit Sentinel Report" below.
                </p>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 text-xs flex items-center gap-2 animate-shake">
                <i className="fa-solid fa-triangle-exclamation text-base" />
                <span className="font-bold">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step 1: Geographic Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#001e40] text-white flex items-center justify-center font-extrabold text-xs shadow-sm font-headline">
                      1
                    </div>
                    <h3 className="text-base font-bold text-[#0b1c30] dark:text-white font-headline">
                      Location Details
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200">
                    * All Location Fields Required
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-10">
                  <div>
                    <label className="form-label flex items-center justify-between">
                      <span>STATE</span>
                      <span className="text-rose-500 font-black text-xs">*</span>
                    </label>
                    <select
                      className="form-select text-xs font-semibold"
                      value={stateRegion}
                      onChange={(e) => handleStateChange(e.target.value)}
                      required
                    >
                      {NORTHEAST_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label flex items-center justify-between">
                      <span>DISTRICT</span>
                      <span className="text-rose-500 font-black text-xs">*</span>
                    </label>
                    <select
                      className="form-select text-xs font-semibold"
                      value={district}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      required
                    >
                      {districtOptions.length === 0 && (
                        <option value="">Select District</option>
                      )}
                      {districtOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label flex items-center justify-between">
                      <span>VILLAGE / SECTOR</span>
                      <span className="text-rose-500 font-black text-xs">*</span>
                    </label>
                    <select
                      className="form-select text-xs font-semibold"
                      value={villageSector}
                      onChange={(e) => setVillageSector(e.target.value)}
                      required
                    >
                      {villageOptions.length === 0 && (
                        <option value="">Select Village</option>
                      )}
                      {villageOptions.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 2: Clinical Signs / Symptoms */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#001e40] text-white flex items-center justify-center font-extrabold text-xs shadow-sm font-headline">
                      2
                    </div>
                    <h3 className="text-base font-bold text-[#0b1c30] dark:text-white font-headline">
                      Observed Symptoms & Affected Count
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200">
                    * At Least 1 Symptom Required
                  </span>
                </div>

                <div className="pl-10 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CLINICAL_SIGNS.map((sign) => {
                      const isSelected = selectedSigns.includes(sign.id);
                      return (
                        <button
                          key={sign.id}
                          type="button"
                          onClick={() => toggleSign(sign.id)}
                          className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#eff4ff] dark:bg-[#142c4a] border-[#003366] text-[#001e40] dark:text-[#a7c8ff] ring-2 ring-[#003366]/20 font-bold shadow-sm'
                              : 'bg-[#f8f9ff] dark:bg-[#061324] border-[#c3c6d1] dark:border-[#1f3c60] text-[#0b1c30] dark:text-[#eaf1ff] hover:bg-gray-100 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <i className={`${sign.iconClass} text-base`} />
                            <span className="text-xs">{sign.label}</span>
                          </div>
                          {isSelected && (
                            <i className="fa-solid fa-circle-check text-xs text-[#006c49] dark:text-[#6cf8bb]" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="form-label flex items-center justify-between">
                        <span>NUMBER OF AFFECTED PEOPLE</span>
                        <span className="text-rose-500 font-black text-xs">* Required</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={affectedPeople}
                        onChange={(e) => setAffectedPeople(+e.target.value)}
                        className="form-input text-xs font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label flex items-center justify-between">
                        <span>DURATION (DAYS)</span>
                        <span className="text-rose-500 font-black text-xs">* Required</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={duration}
                        onChange={(e) => setDuration(+e.target.value)}
                        className="form-input text-xs font-bold"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Water Sources */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#001e40] text-white flex items-center justify-center font-extrabold text-xs shadow-sm font-headline">
                      3
                    </div>
                    <h3 className="text-base font-bold text-[#0b1c30] dark:text-white font-headline">
                      Water Sources
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200">
                      * Required
                    </span>
                    <span className="text-[11px] font-bold text-[#003366] dark:text-[#a7c8ff] bg-[#e5eeff] dark:bg-[#142c4a] px-2.5 py-0.5 rounded-full border border-[#799dd6]/30">
                      {selectedSources.length} selected
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pl-10">
                  {WATER_SOURCES.map((src) => {
                    const isSelected = selectedSources.includes(src.id);
                    return (
                      <button
                        key={src.id}
                        type="button"
                        onClick={() => toggleWaterSource(src.id)}
                        className={`p-3.5 rounded-xl border text-left text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#eff4ff] dark:bg-[#142c4a] border-[#003366] text-[#001e40] dark:text-[#a7c8ff] ring-2 ring-[#003366]/20 font-bold shadow-sm'
                            : 'bg-[#f8f9ff] dark:bg-[#061324] border-[#c3c6d1] dark:border-[#1f3c60] text-[#0b1c30] dark:text-[#eaf1ff] hover:bg-gray-100 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <i className={src.iconClass} />
                          <span>{src.label}</span>
                        </div>
                        {isSelected && (
                          <i className="fa-solid fa-circle-check text-xs text-[#006c49] dark:text-[#6cf8bb]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Submission */}
              <div className="pt-4 border-t border-[#e2e8f0] dark:border-[#1f3c60] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-[11px] text-[#737780] italic">
                  Observations only — this platform routes data directly to accredited medical officers.
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary py-3.5 px-8 text-xs font-extrabold uppercase tracking-wider shadow-md active:scale-95"
                >
                  {loading ? 'Submitting Observation...' : 'Submit Incident Report →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
