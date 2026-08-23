import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../utils/axiosInstance';
import VoiceReporter from '../components/VoiceReporter';

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

const STATES = ['Assam', 'Meghalaya', 'Manipur', 'Nagaland', 'Tripura', 'Mizoram', 'Arunachal Pradesh', 'Sikkim'];

export default function Report() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [stateRegion, setStateRegion] = useState('Assam');
  const [district, setDistrict] = useState(user?.district || 'Kamrup');
  const [villageSector, setVillageSector] = useState(user?.village || 'Majuli Village');
  const [selectedSigns, setSelectedSigns] = useState(['diarrhea', 'vomiting']);
  const [affectedPeople, setAffectedPeople] = useState(2);
  const [duration, setDuration] = useState(2);
  const [selectedSource, setSelectedSource] = useState('community_well');
  const [sourceChannel, setSourceChannel] = useState('APP');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      setSourceChannel('VOICE');
    }
  }, [location.state]);

  const toggleSign = (signId) => {
    setSelectedSigns((prev) =>
      prev.includes(signId) ? prev.filter((s) => s !== signId) : [...prev, signId]
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
    setSourceChannel('VOICE');
    setShowVoiceModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (selectedSigns.length === 0) {
      setErrorMsg('Please select at least one clinical sign/symptom.');
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
        waterSource: selectedSource,
        sourceChannel,
        description: voiceTranscript ? `Voice report transcript: "${voiceTranscript}"` : undefined,
        voiceTranscript: voiceTranscript || undefined,
        notes: voiceTranscript ? `Voice report transcript: "${voiceTranscript}"` : undefined,
      };

      const res = await api.post('/reports', payload);
      if (res.data?.success) {
        setSubmitted(true);
        setTimeout(() => {
          navigate('/');
        }, 1800);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit health report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-8 animate-fadeIn">
      {submitted ? (
        <div className="card p-12 text-center space-y-4 max-w-lg mx-auto border-2 border-[#003366] shadow-xl">
          <div className="w-16 h-16 rounded-full bg-[#001e40] text-white flex items-center justify-center text-2xl mx-auto shadow-md">
            <i className="fa-solid fa-check" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#0b1c30] dark:text-white font-headline">
            Observation Submitted Successfully
          </h2>
          <p className="text-xs text-[#737780] max-w-sm mx-auto">
            Report successfully logged. Surveillance algorithms are computing localized risk metrics and alert triggers.
          </p>
          <div className="pt-2">
            <span className="inline-block text-xs font-bold text-[#001e40] dark:text-[#a7c8ff] animate-pulse">
              Returning to Command Overview...
            </span>
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

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step 1: Geographic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#001e40] text-white flex items-center justify-center font-extrabold text-xs shadow-sm font-headline">
                    1
                  </div>
                  <h3 className="text-base font-bold text-[#0b1c30] dark:text-white font-headline">
                    Location Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-10">
                  <div>
                    <label className="form-label">STATE</label>
                    <select
                      className="form-select text-xs font-semibold"
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                    >
                      {STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">DISTRICT</label>
                    <input
                      type="text"
                      className="form-input text-xs font-semibold"
                      placeholder="e.g. Kamrup"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label">VILLAGE / SECTOR</label>
                    <input
                      type="text"
                      className="form-input text-xs font-semibold"
                      placeholder="e.g. Majuli Village"
                      value={villageSector}
                      onChange={(e) => setVillageSector(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Clinical Signs / Symptoms */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#001e40] text-white flex items-center justify-center font-extrabold text-xs shadow-sm font-headline">
                    2
                  </div>
                  <h3 className="text-base font-bold text-[#0b1c30] dark:text-white font-headline">
                    Observed Symptoms & Affected Count
                  </h3>
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
                          className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                            isSelected
                              ? 'bg-[#eff4ff] dark:bg-[#142c4a] border-[#003366] text-[#001e40] dark:text-[#a7c8ff] ring-2 ring-[#003366]/20 font-bold shadow-sm'
                              : 'bg-[#f8f9ff] dark:bg-[#061324] border-[#c3c6d1] dark:border-[#1f3c60] text-[#0b1c30] dark:text-[#eaf1ff] hover:bg-gray-100 font-medium'
                          }`}
                        >
                          <i className={`${sign.iconClass} text-base`} />
                          <span className="text-xs">{sign.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="form-label">
                        NUMBER OF AFFECTED PEOPLE
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={affectedPeople}
                        onChange={(e) => setAffectedPeople(+e.target.value)}
                        className="form-input text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="form-label">
                        DURATION (DAYS)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={duration}
                        onChange={(e) => setDuration(+e.target.value)}
                        className="form-input text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Water Source */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#001e40] text-white flex items-center justify-center font-extrabold text-xs shadow-sm font-headline">
                    3
                  </div>
                  <h3 className="text-base font-bold text-[#0b1c30] dark:text-white font-headline">
                    Primary Water Source
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pl-10">
                  {WATER_SOURCES.map((src) => {
                    const isSelected = selectedSource === src.id;
                    return (
                      <button
                        key={src.id}
                        type="button"
                        onClick={() => setSelectedSource(src.id)}
                        className={`p-3.5 rounded-xl border text-left text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'bg-[#e5eeff] dark:bg-[#142c4a] border-[#003366] text-[#001e40] dark:text-[#a7c8ff] ring-2 ring-[#003366]/20'
                            : 'bg-[#f8f9ff] dark:bg-[#061324] border-[#c3c6d1] dark:border-[#1f3c60] text-[#0b1c30] dark:text-[#eaf1ff] hover:bg-gray-100'
                        }`}
                      >
                        <i className={src.iconClass} />
                        <span>{src.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Submission */}
              <div className="pt-4 border-t border-[#e2e8f0] dark:border-[#1f3c60] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-[11px] text-[#737780] italic">
                  Observations only — this platform does not provide diagnostic labels.
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
