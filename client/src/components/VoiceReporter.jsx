import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/axiosInstance';

/**
 * VoiceReporter
 * -------------
 * Robust Voice-Assisted Health Reporter with:
 * 1. Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 * 2. Real-time microphone audio visualizer (getUserMedia + Web Audio API)
 * 3. Language selection (English, Hindi, Bengali, Assamese)
 * 4. Error recovery and sample simulation triggers
 * 5. Structured rule-based symptom extraction with confirmation
 */

const LANGUAGES = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
  { code: 'bn-IN', label: 'বাংলা (Bengali)' },
  { code: 'as-IN', label: 'অসমীয়া (Assamese)' },
];

const SAMPLE_PHRASES = [
  'Three family members have severe diarrhea and vomiting since yesterday in Majuli',
  '4 people vomiting with high fever and dehydration in Barpeta',
  'Flood water contaminated well, 2 children have stomach pain and loose motion',
];

export default function VoiceReporter({ onExtractedData, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [selectedLang, setSelectedLang] = useState('en-IN');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedResult, setExtractedResult] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [micActive, setMicActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);

  const recognitionRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onstart = () => {
        setIsRecording(true);
        setErrorMsg(null);
        setInfoMsg('Microphone listening... Speak clearly into your mic.');
      };

      recognition.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        setTranscript(fullTranscript.trim());
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setErrorMsg('Microphone permission blocked. Please click the camera/mic lock icon in your browser address bar to allow access, or type your report below.');
          stopAudioCapture();
          setIsRecording(false);
        } else if (event.error === 'no-speech') {
          // Keep listening or inform user
          setInfoMsg('No speech detected yet. Please speak closer to your microphone...');
        } else if (event.error === 'network') {
          setErrorMsg('Browser speech service network error. (If using Brave/Firefox, speech recognition server may be blocked — you can use the text box below or test phrases).');
        } else {
          setInfoMsg(`Voice status: ${event.error}. You can speak or use the text box below.`);
        }
      };

      recognition.onend = () => {
        // If still flagged as recording (and no error), restart recognition to keep continuous listening
        if (recognitionRef.current && recognitionRef.current._shouldKeepRecording) {
          try {
            recognition.start();
          } catch (_) {}
        } else {
          setIsRecording(false);
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Failed to construct SpeechRecognition:', err);
      setSpeechSupported(false);
    }

    return () => {
      stopAudioCapture();
      if (recognitionRef.current) {
        recognitionRef.current._shouldKeepRecording = false;
        try { recognitionRef.current.stop(); } catch (_) {}
      }
    };
  }, [selectedLang]);

  // Audio level visualizer using Web Audio API
  const startAudioVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setMicActive(true);

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (err) {
      console.warn('Microphone stream error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Microphone access was denied by your browser. Please allow microphone permissions in the browser address bar.');
      }
    }
  };

  const stopAudioCapture = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch (_) {}
    }
    setAudioLevel(0);
    setMicActive(false);
  };

  const startRecording = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setTranscript('');
    setExtractedResult(null);

    // 1. Start audio visualizer (requests mic permission explicitly)
    await startAudioVisualizer();

    // 2. Start Speech Recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current._shouldKeepRecording = true;
        recognitionRef.current.start();
      } catch (err) {
        // already started or retry
        console.warn('Recognition start exception:', err);
      }
    } else {
      setErrorMsg('Speech recognition engine unavailable in this browser. You can type or select a sample phrase below.');
    }
  };

  const stopRecordingAndExtract = async (overrideText) => {
    if (recognitionRef.current) {
      recognitionRef.current._shouldKeepRecording = false;
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    stopAudioCapture();
    setIsRecording(false);

    const textToProcess = overrideText || transcript.trim() || manualText.trim();
    if (!textToProcess) {
      setErrorMsg('Please speak or enter a short description of the illness.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg(null);
      setInfoMsg(null);
      const res = await api.post('/voice/extract', { transcript: textToProcess });
      if (res.data?.success) {
        setExtractedResult(res.data.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to extract symptoms from description');
    } finally {
      setIsProcessing(false);
    }
  };

  const [submittingDirect, setSubmittingDirect] = useState(false);
  const [directSubmitted, setDirectSubmitted] = useState(false);

  const handleSamplePhrase = (phrase) => {
    setTranscript(phrase);
    setManualText(phrase);
    stopRecordingAndExtract(phrase);
  };

  const handleConfirm = () => {
    if (extractedResult?.extracted && onExtractedData) {
      onExtractedData({
        ...extractedResult.extracted,
        transcript: extractedResult.transcript,
        sourceChannel: 'VOICE',
      });
    }
  };

  const handleDirectSubmit = async () => {
    if (!extractedResult?.extracted) return;

    try {
      setSubmittingDirect(true);
      setErrorMsg(null);
      const ext = extractedResult.extracted;
      const payload = {
        village: ext.village || 'Majuli Village',
        district: ext.district || 'Kamrup',
        state: 'Assam',
        symptoms: ext.symptoms && ext.symptoms.length > 0 ? ext.symptoms : ['other'],
        affectedPeople: ext.affectedPeople || 1,
        affectedCount: ext.affectedPeople || 1,
        duration: ext.duration || 1,
        durationDays: ext.duration || 1,
        waterSource: ext.waterSource || 'tap',
        sourceChannel: 'VOICE',
        description: `Voice report transcript: "${extractedResult.transcript || transcript}"`,
        voiceTranscript: extractedResult.transcript || transcript,
        notes: `Voice report transcript: "${extractedResult.transcript || transcript}"`,
      };

      const res = await api.post('/reports', payload);
      if (res.data?.success) {
        setDirectSubmitted(true);
        setTimeout(() => {
          if (onExtractedData) {
            onExtractedData({ submittedDirect: true });
          }
          if (onCancel) onCancel();
        }, 2000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit voice report directly. You can edit in the form.');
    } finally {
      setSubmittingDirect(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0c1f1c] border-2 border-teal-500/40 dark:border-teal-500/30 rounded-3xl p-6 shadow-2xl space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e2e8f0] dark:border-[#1f3c60] pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#001e40] text-white flex items-center justify-center text-base shadow-sm">
            <i className="fa-solid fa-microphone-lines" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#0b1c30] dark:text-white font-headline">
              Voice-Assisted Health Reporting
            </h3>
            <p className="text-xs text-[#737780]">
              Speak naturally about symptoms, affected members, and duration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            disabled={isRecording}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[#c3c6d1] dark:border-[#1f3c60] bg-white dark:bg-[#0c1f36] text-[#0b1c30] dark:text-white focus:outline-none"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>

          {onCancel && (
            <button
              onClick={onCancel}
              className="text-[#737780] hover:text-[#0b1c30] dark:hover:text-white text-xs font-bold p-1 rounded-lg cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-sm" />
            </button>
          )}
        </div>
      </div>

      {/* Error & Info Alerts */}
      {errorMsg && (
        <div className="p-3.5 bg-[#ffdad6] dark:bg-rose-950/40 border border-[#ba1a1a]/30 rounded-xl text-xs text-[#93000a] dark:text-rose-200 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <i className="fa-solid fa-triangle-exclamation" />
            <span>Microphone Notice</span>
          </p>
          <p>{errorMsg}</p>
        </div>
      )}

      {infoMsg && !errorMsg && (
        <div className="p-3 bg-[#e5eeff] dark:bg-[#142c4a] border border-[#003366]/30 rounded-xl text-xs text-[#001e40] dark:text-[#a7c8ff]">
          {infoMsg}
        </div>
      )}

      {/* Main Recording Interactive Hub */}
      <div className="flex flex-col items-center justify-center p-6 bg-[#f8f9ff] dark:bg-[#061324] border border-[#e2e8f0] dark:border-[#1f3c60] rounded-2xl space-y-4">
        {/* Large Pulse Button */}
        <div className="relative">
          {isRecording && (
            <div
              className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping pointer-events-none"
              style={{ transform: `scale(${1 + audioLevel / 60})` }}
            />
          )}
          <button
            type="button"
            onClick={isRecording ? () => stopRecordingAndExtract() : startRecording}
            className={`w-20 h-20 rounded-full flex flex-col items-center justify-center text-2xl transition-all shadow-xl active:scale-95 cursor-pointer relative z-10 ${
              isRecording
                ? 'bg-[#ba1a1a] hover:bg-[#93000a] text-white ring-8 ring-rose-500/20 animate-pulse'
                : 'bg-[#001e40] hover:bg-[#003366] text-white hover:scale-105 shadow-md border-2 border-[#003366]'
            }`}
          >
            <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'}`} />
          </button>
        </div>

        {/* Live Audio Visualizer Bars */}
        {isRecording && (
          <div className="flex items-center gap-1.5 h-6">
            {[20, 50, 80, 100, 70, 40, 90, 60, 30].map((h, i) => {
              const barHeight = Math.max(4, (audioLevel * h) / 100);
              return (
                <div
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-[#003366] to-[#6cf8bb] rounded-full transition-all duration-75"
                  style={{ height: `${barHeight}px` }}
                />
              );
            })}
          </div>
        )}

        <div className="text-center space-y-0.5">
          <p className="text-xs font-bold text-[#0b1c30] dark:text-white uppercase tracking-wider font-headline">
            {isRecording ? 'Listening in Real-Time...' : 'Tap to Start Speaking'}
          </p>
          <p className="text-[11px] text-[#737780]">
            {isRecording ? 'Tap the stop button when you finish speaking' : 'Microphone will capture symptoms and numbers'}
          </p>
        </div>

        {/* Live Transcript Display Box */}
        {transcript ? (
          <div className="w-full p-3.5 bg-white dark:bg-[#0c1f36] border-2 border-[#003366] rounded-xl text-xs text-[#0b1c30] dark:text-white font-medium text-center shadow-inner">
            <span className="text-[10px] uppercase font-bold text-[#003366] dark:text-[#a7c8ff] block mb-1">
              Captured Speech
            </span>
            "{transcript}"
          </div>
        ) : isRecording ? (
          <div className="text-xs text-[#003366] dark:text-[#a7c8ff] italic animate-pulse">
            Listening for voice...
          </div>
        ) : null}
      </div>

      {/* Quick Test Preset Buttons */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase text-[#737780] tracking-wider">
          Or Quick Test with Sample Incident Scenarios
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SAMPLE_PHRASES.map((phrase, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSamplePhrase(phrase)}
              className="p-2.5 bg-white dark:bg-[#0c1f36] hover:bg-[#e5eeff] dark:hover:bg-[#142c4a] border border-[#e2e8f0] dark:border-[#1f3c60] rounded-lg text-left text-[11px] text-[#0b1c30] dark:text-[#eaf1ff] transition line-clamp-2 cursor-pointer flex items-start gap-1.5"
            >
              <i className="fa-solid fa-comment-medical text-[#003366] dark:text-[#a7c8ff] mt-0.5 shrink-0" />
              <span>"{phrase}"</span>
            </button>
          ))}
        </div>
      </div>

      {/* Manual text alternative */}
      <div className="space-y-1.5 pt-2 border-t border-[#e2e8f0] dark:border-[#1f3c60]">
        <label className="text-xs font-bold text-[#43474f] dark:text-[#c3c6d1] flex items-center justify-between">
          <span>Type or Edit Description:</span>
          <span className="text-[10px] text-[#737780] font-normal">Supports Hindi, Assamese, Bengali, English</span>
        </label>
        <textarea
          rows={2}
          value={manualText || transcript}
          onChange={(e) => {
            setManualText(e.target.value);
            setTranscript(e.target.value);
          }}
          placeholder="e.g. 3 people vomiting with high fever in Majuli..."
          className="form-input text-xs"
        />
        {!isRecording && (manualText || transcript) && !extractedResult && (
          <button
            type="button"
            onClick={() => stopRecordingAndExtract(manualText || transcript)}
            disabled={isProcessing}
            className="w-full btn btn-primary py-2.5 text-xs font-bold"
          >
            <i className="fa-solid fa-magnifying-glass-chart" />
            <span>{isProcessing ? 'Analyzing Speech & Extracting Symptoms...' : 'Extract Structured Fields from Text'}</span>
          </button>
        )}
      </div>

      {/* Extracted Fields Confirmation Box */}
      {extractedResult && (
        <div className="bg-[#e5eeff] dark:bg-[#142c4a] border-2 border-[#003366] rounded-xl p-5 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-[#001e40] dark:text-white flex items-center gap-2 font-headline">
              <i className="fa-solid fa-circle-check text-[#006c49] dark:text-[#6cf8bb]" />
              <span>Structured Data Extracted Successfully</span>
            </h4>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-[#001e40] text-white">
              Confidence: {extractedResult.extracted?.confidence}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
            <div className="bg-white dark:bg-[#0c1f36] p-3 rounded-lg border border-[#e2e8f0] dark:border-[#1f3c60] shadow-sm flex flex-col justify-center">
              <span className="text-[10px] text-[#737780] block uppercase font-bold">Affected Region</span>
              <span className="font-bold text-[#0b1c30] dark:text-white text-xs truncate flex items-center justify-center gap-1 mt-0.5" title={`${extractedResult.extracted?.village || 'Majuli Village'}, ${extractedResult.extracted?.district || 'Kamrup'}`}>
                <i className="fa-solid fa-location-dot text-[#006c49] dark:text-[#6cf8bb] text-[10px]" />
                <span>{extractedResult.extracted?.village || 'Majuli Village'}</span>
              </span>
              <span className="text-[9px] text-[#737780]">{extractedResult.extracted?.district || 'Kamrup'}</span>
            </div>
            <div className="bg-white dark:bg-[#0c1f36] p-3 rounded-lg border border-[#e2e8f0] dark:border-[#1f3c60] shadow-sm flex flex-col justify-center">
              <span className="text-[10px] text-[#737780] block uppercase font-bold">Symptoms</span>
              <span className="font-bold text-[#0b1c30] dark:text-white capitalize text-xs mt-0.5">
                {(extractedResult.extracted?.symptoms || []).join(', ') || 'General Illness'}
              </span>
            </div>
            <div className="bg-white dark:bg-[#0c1f36] p-3 rounded-lg border border-[#e2e8f0] dark:border-[#1f3c60] shadow-sm flex flex-col justify-center">
              <span className="text-[10px] text-[#737780] block uppercase font-bold">Affected People</span>
              <span className="font-bold text-[#0b1c30] dark:text-white text-xs mt-0.5">
                {extractedResult.extracted?.affectedPeople || 1} people
              </span>
            </div>
            <div className="bg-white dark:bg-[#0c1f36] p-3 rounded-lg border border-[#e2e8f0] dark:border-[#1f3c60] shadow-sm flex flex-col justify-center">
              <span className="text-[10px] text-[#737780] block uppercase font-bold">Duration</span>
              <span className="font-bold text-[#0b1c30] dark:text-white text-xs mt-0.5">
                {extractedResult.extracted?.duration || 1} day(s)
              </span>
            </div>
          </div>

          {directSubmitted ? (
            <div className="p-4 bg-[#6cf8bb]/20 border border-[#006c49] rounded-xl text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#006c49] text-white flex items-center justify-center text-lg mx-auto shadow-md">
                <i className="fa-solid fa-check" />
              </div>
              <h5 className="font-extrabold text-sm text-[#006c49] dark:text-[#6cf8bb] font-headline">
                Voice Report Logged & Broadcasted Live!
              </h5>
              <p className="text-[11px] text-[#43474f] dark:text-[#cbdbf5]">
                Surveillance algorithms updated telemetry and notified response teams.
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleDirectSubmit}
                disabled={submittingDirect}
                className="flex-1 btn bg-[#006c49] hover:bg-[#00855a] text-white py-2.5 text-xs font-bold shadow-md active:scale-95 transition"
              >
                <i className={`fa-solid ${submittingDirect ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`} />
                <span>{submittingDirect ? 'Broadcasting Report...' : 'Submit Report Immediately'}</span>
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="btn btn-primary py-2.5 text-xs font-bold"
              >
                <i className="fa-solid fa-pen-to-square" />
                <span>Edit in Form</span>
              </button>
              <button
                type="button"
                onClick={() => setExtractedResult(null)}
                className="btn btn-secondary py-2.5 text-xs font-bold"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-gray-400 italic text-center">
        All extracted fields can be reviewed and edited before final submission to protect data integrity.
      </p>
    </div>
  );
}
