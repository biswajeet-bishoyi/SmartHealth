import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../utils/axiosInstance';

const CATEGORIES = [
  { id: 'water', label: 'Water Safety', iconClass: 'fa-solid fa-water', desc: 'Purification calculations, well chlorination, and Jal Jeevan Mission field testing' },
  { id: 'disease', label: 'Disease Prevention', iconClass: 'fa-solid fa-shield-halved', desc: 'Symptom triage, ORS preparation, and flood hygiene protocols' },
  { id: 'emergency', label: 'Emergency Action', iconClass: 'fa-solid fa-truck-medical', desc: 'Authentic 24x7 Northeast hotlines, district control rooms, and disaster units' },
];

const DOWNLOADABLE_FILES = [
  {
    id: 1,
    title: 'Water Purification & Well Chlorination Field Protocol',
    type: 'DOC • 12KB',
    iconClass: 'fa-solid fa-file-lines text-blue-500',
    category: 'water',
    content: `================================================================================
SMARTHEALTH NORTHEAST — OFFICIAL PUBLIC HEALTH REFERENCE MANUAL
PROTOCOL REF: NE-JJM-WSS-2026/04
TITLE: RURAL WATER PURIFICATION & EMERGENCY WELL CHLORINATION PROTOCOL
Applicable Zones: Brahmaputra Valley, Barak Valley, Hills & Riverine Belts
================================================================================

1. HOUSEHOLD BOILING GUIDELINES
--------------------------------------------------------------------------------
- Bring water to a vigorous, rolling boil for at least ONE (1) FULL MINUTE in lowland areas (<1,000m altitude).
- In high-altitude regions (Arunachal Pradesh, Sikkim >1,000m altitude), maintain rolling boil for THREE (3) MINUTES due to lower atmospheric pressure.
- Allow water to cool naturally inside a sanitized, covered container with a narrow dispensing tap. DO NOT immerse unwashed cups or hands.

2. HALAZONE & NADCC CHLORINE TABLET DOSAGE
--------------------------------------------------------------------------------
- Clear Water: 1 tablet (containing 5mg to 10mg available chlorine / Halazone) per 20 Litres of clear water.
- Turbid / Flood Water: Filter first through a clean multi-layer cloth or sand-settling filter, then use 2 tablets per 20 Litres.
- Contact Time: Wait at least 30 MINUTES before drinking to allow complete pathogenic inactivation.
- Residual Chlorine Target: 0.2 to 0.5 mg/L (tested via Orthotolidine/DPD field kit).

3. EMERGENCY RING WELL & BOREWELL CHLORINATION (SHOCK DOSING)
--------------------------------------------------------------------------------
- Standard Bleaching Powder (33% Available Chlorine):
  Formula: Grams required = (Diameter in meters)^2 * Depth of water column in meters * 2.5 grams.
- Example for a typical 1.5m diameter well with 3m water depth:
  Weight = (1.5 * 1.5) * 3 * 2.5 = 16.875 grams of bleaching powder.
- Dissolve powder in a bucket of clean water, let the precipitate settle for 20 mins, and pour the clear chlorine solution into the well.
- Allow 6 hours contact time (preferably overnight) before drawing drinking water.

4. JAL JEEVAN MISSION FIELD TEST KIT (FTK) BENCHMARKS
--------------------------------------------------------------------------------
- Turbidity: Safe < 5 NTU (Discard or coagulate with alum if > 10 NTU).
- pH: Optimal 6.5 to 8.5.
- Total Dissolved Solids (TDS): < 500 mg/L permissible.
- Fecal Coliforms / E. Coli: 0 CFU/100 mL (Absolute Zero tolerance).

Report suspicious contamination immediately via the SmartHealthNE Report tab.`,
  },
  {
    id: 2,
    title: 'Standard Sanitation & Flood Vector Control Guidelines',
    type: 'PDF • 18KB',
    iconClass: 'fa-solid fa-file-pdf text-rose-500',
    category: 'disease',
    content: `================================================================================
SMARTHEALTH NORTHEAST — POST-FLOOD SANITATION & HYGIENE SOP
STANDARD OPERATING PROCEDURE: EPIDEMIC PREVENTION IN MONSOON ZONES
================================================================================

1. POST-FLOOD PIT LATRINE & ENVIRONMENT DISINFECTION
--------------------------------------------------------------------------------
- Never defecate in open water channels, upstream river banks, or submerged wetlands.
- For flooded pit latrines, apply quicklime (calcium oxide) or bleaching powder (1 kg per latrine pit) immediately after floodwaters recede.
- Ensure community water sources are situated at least 30 METERS (100 feet) away from latrines and cattle enclosures.

2. WHO ORAL REHYDRATION SALTS (ORS) & ZINC PROTOCOL
--------------------------------------------------------------------------------
- Preparation: Dissolve 1 entire packet of WHO-standard low-osmolarity ORS in exactly ONE (1) LITRE of clean, boiled-then-cooled drinking water.
- Storage: Discard unused prepared ORS solution after 24 HOURS.
- Administration Schedule:
  * Children under 2 years: 50 to 100 mL after each loose stool.
  * Children 2 to 9 years: 100 to 200 mL after each loose stool.
  * Adults & older children: Drink as much as tolerated (minimum 200–400 mL per stool).
- Zinc Supplementation: 20 mg dispersible zinc daily for 14 days (10 mg for infants under 6 months) to rebuild intestinal mucosa.

3. VECTOR BREEDING SUPPRESSION (MALARIA & DENGUE)
--------------------------------------------------------------------------------
- Eliminate stagnant water pools around habitation within 48 hours of rainfall.
- Introduce Guppy (Poecilia reticulata) or Gambusia bio-control fish in village ponds.
- Apply Abate / Temephos 50% EC larvicide at 1 ppm in non-potable storage water.
- Ensure all household members sleep under Long-Lasting Insecticidal Nets (LLINs).`,
  },
  {
    id: 3,
    title: 'Northeast India 24x7 Emergency Health & Disaster Directory',
    type: 'PDF • 22KB',
    iconClass: 'fa-solid fa-phone text-emerald-500',
    category: 'emergency',
    content: `================================================================================
SMARTHEALTH NORTHEAST — AUTHENTIC EMERGENCY DIRECTORY & HELPLINE REGISTRY
VERIFIED GOVERNMENT OF INDIA & NORTHEAST STATE HEALTH ADVISORY CONTACTS
================================================================================

1. NATIONAL & UNIVERSAL EMERGENCY HELPLINES (ALL 8 NE STATES)
--------------------------------------------------------------------------------
- 104 : National Health Mission 24x7 Medical Tele-Consultation & Health Advice (Toll-Free)
- 108 : Emergency Medical, Ambulance & Trauma Care Dispatch Service
- 1070: State Disaster Management Emergency Operations Centre (SEOC)
- 1077: District Disaster Management Authority (DDMA) Control Room
- 112 : National Unified Emergency Response Number (Police, Fire, Medical)

2. ASSAM STATE DIRECTORY
--------------------------------------------------------------------------------
- Assam State Disaster Management Authority (ASDMA), Dispur:
  Phone: 0361-2237221 / 0361-2237011 | Toll-Free: 1070 / 1079
- Kamrup District Disaster Management Control Room:
  Phone: 0361-2731215 / 0361-2684407 | Email: ddma-kamrup@assam.gov.in
- Guwahati Medical College & Hospital (GMCH) Emergency Ward:
  Phone: 0361-2529457 / 0361-2130206
- ICMR Regional Medical Research Centre (NE Region), Dibrugarh:
  Phone: 0373-2381494 / 0373-2381548

3. MEGHALAYA STATE DIRECTORY
--------------------------------------------------------------------------------
- State Emergency Operation Centre (SEOC), Shillong:
  Phone: 0364-2502188 / 0364-2502098 | Toll-Free: 1070
- NEIGRIHMS Regional Referral Hospital, Mawdiangdiang, Shillong:
  Phone: 0364-2538020 / 0364-2538011
- East Khasi Hills District Control Room: 0364-2224010

4. MANIPUR STATE DIRECTORY
--------------------------------------------------------------------------------
- Directorate of Health Services Control Room, Imphal:
  Phone: 1800-345-3818 / 0385-2414664
- Regional Institute of Medical Sciences (RIMS), Imphal:
  Phone: 0385-2414629 / 0385-2414750

5. ARUNACHAL PRADESH & SIKKIM DIRECTORY
--------------------------------------------------------------------------------
- Arunachal State Disaster Operations, Itanagar: 0360-2212338 / 1070
- Tomo Riba Institute of Health & Medical Sciences (TRIHMS), Naharlagun: 0360-2244248
- Sikkim Disaster Management Control Room, Gangtok: 03592-202461 / 1070
- STNM Hospital Emergency, Sochakgang, Sichey: 03592-202944

6. TRIPURA, MIZORAM & NAGALAND DIRECTORY
--------------------------------------------------------------------------------
- Tripura Disaster Control Room, Agartala: 0381-2418045 / 1070
- Mizoram Emergency Operations Centre, Aizawl: 0389-2342520 / 1070
- Nagaland State Disaster Management Authority (NSDMA), Kohima: 0370-2291122 / 1070
- NDRF 1st Battalion (Patgaon, Guwahati) Regional Headquarters: 0361-2840284 / 0361-2840008`,
  },
  {
    id: 4,
    title: 'Water-Borne Outbreak Rapid Response SOP (ASHA/ANM Manual)',
    type: 'DOC • 16KB',
    iconClass: 'fa-solid fa-file-medical text-purple-500',
    category: 'disease',
    content: `================================================================================
SMARTHEALTH NORTHEAST — HEALTH WORKER TRIAGE & FIELD EPIDEMIOLOGY MANUAL
MODULE 4: RAPID SYNDROMIC OUTBREAK SURVEILLANCE & REHYDRATION TRIAGE
================================================================================

1. CASE DEFINITION FOR SUSPECTED ACUTE DIARRHEAL DISEASE (ADD)
--------------------------------------------------------------------------------
- Any individual passing 3 or more loose, watery stools within a 24-hour period.
- High-Risk Cluster Flag: >= 3 distinct households in the same village exhibiting symptoms within 48 hours.

2. CLINICAL DEHYDRATION TRIAGE MATRIX
--------------------------------------------------------------------------------
[PLAN A: NO DEHYDRATION]
- Signs: Alert, normal eyes, drinks normally, immediate skin pinch retraction.
- Action: Home treatment with extra fluids (ORS, coconut water, rice kanji), continue normal feeding.

[PLAN B: MODERATE DEHYDRATION]
- Signs: Restless/irritable, sunken eyes, drinks eagerly (thirsty), skin pinch goes back slowly (1–2 seconds).
- Action: Administer 75 mL/kg ORS at the Sub-Centre under observation over 4 hours. Reassess.

[PLAN C: SEVERE DEHYDRATION (EMERGENCY)]
- Signs: Lethargic or unconscious, very sunken dry eyes, unable to drink, skin pinch goes back very slowly (> 2 seconds).
- Action: IMMEDIATE URGENT REFERRAL to PHC/CHC. Start IV Ringer's Lactate (100 mL/kg) without delay.

3. FIELD NOTIFICATION WORKFLOW
--------------------------------------------------------------------------------
1. Log syndromic counts into SmartHealthNE Sentinel app within 2 hours.
2. Distribute chlorine tablets and ORS sachets door-to-door in the affected radius.
3. Collect 2 water samples in sterile containers from suspected drinking water sources and transport to District Public Health Laboratory within 24 hours.`,
  },
];

const BASELINE_FAQS = [
  {
    q: 'Where can I get water purification or chlorine tablets in rural Northeast districts?',
    a: 'Chlorine purification tablets (Halazone / NaDCC) and ORS packets are distributed free of charge through your accredited Village ASHA worker and at all Sub-Centres and Primary Health Centres (PHCs).',
    category: 'water',
    source: 'National Health Mission Guidelines',
  },
  {
    q: 'What should our community do if well water turns turbid, yellowish, or has a strange odor?',
    a: 'Immediately avoid consuming untreated water from that point. Submit an instant incident report via the SmartHealthNE "Report Incident" tab so the District Surveillance Unit can dispatch a water-testing team to conduct chemical and bacteriological testing.',
    category: 'water',
    source: 'Jal Jeevan Mission Standard Protocol',
  },
  {
    q: 'How long should drinking water be boiled to guarantee it is pathogen-free?',
    a: 'In plains (Assam, Tripura, Manipur valleys), boil vigorously for at least 1 full minute. In hilly zones (Arunachal Pradesh, Sikkim, Meghalaya highlands), boil for at least 3 minutes to compensate for the lower boiling point of water at altitude.',
    category: 'water',
    source: 'WHO Water Sanitation Advisory',
  },
  {
    q: 'What are the primary warning signs that a family member has severe dehydration?',
    a: 'Sunken eyes, extreme lethargy or confusion, parched dry tongue, very dark or absent urine for over 6 hours, and skin that does not snap back when pinched. Immediately start ORS solution and transport the patient to the nearest PHC or call 108.',
    category: 'disease',
    source: 'Integrated Disease Surveillance Programme (IDSP)',
  },
];

const Resources = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openFaq, setOpenFaq] = useState(0);

  // Community Query State
  const [userQueries, setUserQueries] = useState([]);
  const [allQueries, setAllQueries] = useState([]);
  const [commonQueries, setCommonQueries] = useState([]);
  const [questionText, setQuestionText] = useState('');
  const [questionCategory, setQuestionCategory] = useState('water');
  const [submittingQuery, setSubmittingQuery] = useState(false);
  const [querySuccess, setQuerySuccess] = useState('');
  const [queryError, setQueryError] = useState('');

  // Health Worker Answer State
  const [answeringQueryId, setAnsweringQueryId] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [markAsCommon, setMarkAsCommon] = useState(true);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const isHealthStaff = user?.role === 'HEALTH_WORKER' || user?.role === 'NATIONAL_ADMIN';

  // Fetch queries from backend
  const fetchQueries = async () => {
    try {
      const res = await api.get('/queries');
      if (res.data?.data) {
        if (isHealthStaff) {
          setAllQueries(res.data.data.queries || []);
        } else {
          setUserQueries(res.data.data.userQueries || []);
          setCommonQueries(res.data.data.commonQueries || []);
        }
      }
    } catch (err) {
      console.error('Failed to load queries:', err);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [user]);

  const handleDownload = (file) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleCreateQuery = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    try {
      setSubmittingQuery(true);
      setQueryError('');
      setQuerySuccess('');

      const payload = {
        question: questionText,
        category: questionCategory,
        village: user?.village || 'Majuli Village',
        district: user?.district || 'Kamrup',
        state: user?.state || 'Assam',
      };

      await api.post('/queries', payload);
      setQuerySuccess('✅ Your question has been submitted to local Health Officers! You will see their answer here.');
      setQuestionText('');
      fetchQueries();
    } catch (err) {
      setQueryError(err.response?.data?.message || 'Failed to submit question.');
    } finally {
      setSubmittingQuery(false);
    }
  };

  const handleAnswerSubmit = async (queryId) => {
    if (!answerText.trim()) return;

    try {
      setSubmittingAnswer(true);
      await api.patch(`/queries/${queryId}/answer`, {
        answer: answerText,
        isCommonQuestion: markAsCommon,
      });

      setAnsweringQueryId(null);
      setAnswerText('');
      fetchQueries();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit answer.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleToggleCommon = async (queryId) => {
    try {
      await api.patch(`/queries/${queryId}/toggle-common`);
      fetchQueries();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const filteredFiles =
    selectedCategory === 'all'
      ? DOWNLOADABLE_FILES
      : DOWNLOADABLE_FILES.filter((f) => f.category === selectedCategory);

  // Combined FAQs (Baseline curated + Verified Community Q&As)
  const publishedCommunityFaqs = (isHealthStaff ? allQueries : commonQueries).filter(
    (q) => q.status === 'ANSWERED' && q.isCommonQuestion
  );

  return (
    <div className="space-y-10 pb-12">
      {/* ─── Hero Banner ────────────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl border border-[#003366] bg-gradient-to-r from-[#001e40] via-[#002d5c] to-[#00142b] text-white p-8 sm:p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#003366] text-[#a7c8ff] border border-[#799dd6]/30 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#6cf8bb] animate-pulse" />
              PUBLIC HEALTH EDUCATION & COMMUNITY ADVISORY
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-headline">
              Northeast Public Health <span className="text-[#a7c8ff] block sm:inline">Knowledge Center</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#cbdbf5] leading-relaxed">
              Official protocols, WHO purification calculators, verified emergency numbers for all 8 Northeast states, and direct community inquiry triage.
            </p>
          </div>

          <div className="flex items-center gap-4 self-start md:self-auto">
            <div className="p-3.5 bg-[#00142b] rounded-xl border border-[#003366] text-center min-w-[90px]">
              <div className="text-sm font-extrabold text-white font-headline">104 / 108</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#a7c8ff]">
                24/7 HELPLINE
              </div>
            </div>
            <div className="p-3.5 bg-[#00142b] rounded-xl border border-[#003366] text-center min-w-[90px]">
              <div className="text-sm font-extrabold text-white font-headline">8 STATES</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#a7c8ff]">
                DIRECTORY
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Category Shortcuts Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
            className={`card p-6 text-left flex items-start gap-4 transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'border-2 border-[#003366] bg-[#e5eeff] dark:bg-[#142c4a] shadow-md ring-2 ring-[#003366]/20'
                : 'hover:border-[#003366]'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-[#e5eeff] dark:bg-[#142c4a] text-[#001e40] dark:text-[#a7c8ff] flex items-center justify-center text-xl shrink-0 shadow-inner">
              <i className={cat.iconClass} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0b1c30] dark:text-white font-headline">
                {cat.label}
              </h3>
              <p className="text-xs text-[#737780] dark:text-[#94a3b8] mt-1 leading-relaxed">
                {cat.desc}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* ─── Community Inquiry & Q&A Hub Section ──────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-[#001e40] dark:text-white font-headline tracking-tight">
                Ask Local Health Worker / Officer
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                LIVE TRIAGE
              </span>
            </div>
            <p className="text-xs text-[#737780] dark:text-[#94a3b8]">
              Have a water safety or symptom question? Get direct, verified answers from medical field teams in your district.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Ask Question Form (Community) */}
          <div className="lg:col-span-5 card p-6 space-y-4 border border-[#c3c6d1] dark:border-[#1f3c60] shadow-sm">
            <div className="flex items-center gap-2.5 text-[#003366] dark:text-[#a7c8ff] border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="w-8 h-8 rounded-lg bg-[#e5eeff] dark:bg-[#142c4a] flex items-center justify-center">
                <i className="fa-solid fa-comments text-[#003366] dark:text-[#a7c8ff]" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm font-headline text-[#0b1c30] dark:text-white">Submit a Community Inquiry</h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Direct response from local health workers</p>
              </div>
            </div>

            {querySuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs border border-emerald-300 dark:border-emerald-800 flex items-center gap-2">
                <i className="fa-solid fa-circle-check" />
                <span>{querySuccess}</span>
              </div>
            )}

            {queryError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 rounded-xl text-xs border border-rose-300 dark:border-rose-800 flex items-center gap-2">
                <i className="fa-solid fa-triangle-exclamation" />
                <span>{queryError}</span>
              </div>
            )}

            <form onSubmit={handleCreateQuery} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={questionCategory}
                  onChange={(e) => setQuestionCategory(e.target.value)}
                  className="w-full rounded-xl border border-[#c3c6d1] dark:border-[#1f3c60] bg-white dark:bg-[#061324] text-[#0b1c30] dark:text-white px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-[#003366] focus:outline-none shadow-sm cursor-pointer"
                >
                  <option value="water">💧 Water Safety & Well Purification</option>
                  <option value="disease">🩺 Symptoms, Diarrhea & ORS Care</option>
                  <option value="emergency">🚑 Medical Camps & Urgent Help</option>
                  <option value="general">📋 General Health Guidance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Your Question / Concern
                </label>
                <textarea
                  rows={4}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="e.g., Our village ring well water became muddy after rain. Can we use chlorine tablets directly or should we boil first?"
                  className="w-full rounded-xl border border-[#c3c6d1] dark:border-[#1f3c60] bg-white dark:bg-[#061324] text-[#0b1c30] dark:text-white p-3.5 text-xs leading-relaxed focus:ring-2 focus:ring-[#003366] focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-inner resize-y min-h-[110px]"
                  required
                />
              </div>

              <div className="p-2.5 bg-gray-50 dark:bg-[#061324] rounded-xl border border-gray-100 dark:border-gray-800 text-[11px] text-[#737780] dark:text-[#94a3b8] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <i className="fa-solid fa-location-dot text-rose-500" />
                  <span>Submitting for: <b className="text-[#0b1c30] dark:text-white">{user?.village || 'Majuli Village'}, {user?.district || 'Kamrup'}</b></span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <button
                type="submit"
                disabled={submittingQuery}
                className="w-full bg-[#001e40] hover:bg-[#003366] text-white py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <i className="fa-solid fa-paper-plane text-xs" />
                <span>{submittingQuery ? 'Sending to Health Team...' : 'Submit Inquiry to Health Worker'}</span>
              </button>
            </form>
          </div>

          {/* Inquiry Feed & Answers */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-extrabold text-sm text-[#001e40] dark:text-white font-headline flex items-center justify-between">
              <span>{isHealthStaff ? 'Incoming Community Inquiries' : 'My Inquiries & Field Responses'}</span>
              <button onClick={fetchQueries} className="text-xs font-bold text-[#003366] dark:text-[#a7c8ff] hover:underline flex items-center gap-1">
                <i className="fa-solid fa-arrows-rotate text-[10px]" /> Refresh
              </button>
            </h3>

            {/* List Queries */}
            {(isHealthStaff ? allQueries : userQueries).length === 0 ? (
              <div className="card p-8 text-center text-xs text-[#737780] border border-dashed border-[#c3c6d1] dark:border-[#1f3c60]">
                <i className="fa-solid fa-circle-question text-3xl mb-2 opacity-40" />
                <p>No inquiries found. Post a question to get official guidance from local health teams.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {(isHealthStaff ? allQueries : userQueries).map((q) => (
                  <div key={q._id} className="card p-4 space-y-3 border border-[#c3c6d1] dark:border-[#1f3c60] hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-200">
                            {q.category}
                          </span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white font-headline">
                            {q.userName}
                          </span>
                          <span className="text-[10px] text-[#737780]">
                            • {q.village}, {q.district}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 pt-0.5">
                          "{q.question}"
                        </p>
                      </div>

                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shrink-0 border ${
                        q.status === 'ANSWERED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 animate-pulse'
                      }`}>
                        {q.status === 'ANSWERED' ? '✓ Answered' : '⏳ Pending'}
                      </span>
                    </div>

                    {/* Answer Block */}
                    {q.status === 'ANSWERED' && (
                      <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900 dark:text-emerald-200">
                          <span className="flex items-center gap-1.5">
                            <i className="fa-solid fa-user-doctor text-emerald-600 dark:text-emerald-400" />
                            {q.answeredByName || 'Accredited Health Worker'}
                          </span>
                          <span className="text-[10px] opacity-75">
                            {new Date(q.answeredAt || q.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-emerald-950 dark:text-emerald-100 leading-relaxed font-medium">
                          {q.answer}
                        </p>

                        {/* Health Staff FAQ Toggle */}
                        {isHealthStaff && (
                          <div className="pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50 flex items-center justify-between">
                            <span className="text-[10px] text-gray-500">
                              {q.isCommonQuestion ? '🌟 Featured in Public Common Questions' : 'Private to User'}
                            </span>
                            <button
                              onClick={() => handleToggleCommon(q._id)}
                              className="text-[11px] font-bold text-[#003366] dark:text-[#a7c8ff] hover:underline"
                            >
                              {q.isCommonQuestion ? 'Remove from FAQs' : '+ Publish to Common Questions'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Health Staff Answering Box */}
                    {isHealthStaff && q.status === 'PENDING' && (
                      <div className="pt-2 border-t border-gray-100 dark:border-[#1f3c60]">
                        {answeringQueryId === q._id ? (
                          <div className="space-y-3 bg-gray-50 dark:bg-[#142c4a]/50 p-3 rounded-xl">
                            <label className="form-label text-[11px]">Official Medical Guidance</label>
                            <textarea
                              rows={3}
                              value={answerText}
                              onChange={(e) => setAnswerText(e.target.value)}
                              placeholder="Provide clinical dosage, boiling advice, or immediate action..."
                              className="w-full rounded-xl border border-[#c3c6d1] dark:border-[#1f3c60] bg-white dark:bg-[#061324] text-[#0b1c30] dark:text-white p-3 text-xs leading-relaxed focus:ring-2 focus:ring-[#003366] focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-inner resize-y min-h-[90px]"
                            />
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={markAsCommon}
                                  onChange={(e) => setMarkAsCommon(e.target.checked)}
                                  className="form-checkbox text-[#003366] rounded"
                                />
                                <span>Publish to Public Common Questions (FAQ)</span>
                              </label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => { setAnsweringQueryId(null); setAnswerText(''); }}
                                  className="btn btn-secondary text-xs py-1.5 px-3"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={submittingAnswer}
                                  onClick={() => handleAnswerSubmit(q._id)}
                                  className="btn btn-primary text-xs py-1.5 px-4 font-bold"
                                >
                                  {submittingAnswer ? 'Saving...' : 'Submit Official Answer'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setAnsweringQueryId(q._id); setAnswerText(''); }}
                            className="btn btn-secondary w-full text-xs py-1.5 font-bold flex items-center justify-center gap-1.5"
                          >
                            <i className="fa-solid fa-reply" />
                            <span>Respond to this Resident Inquiry</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Resource Library & Official Reference Protocols ─────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-[#0b1c30] dark:text-white font-headline">
              Official Reference Library & Emergency Protocols
            </h3>
            <p className="text-xs text-[#737780] dark:text-[#94a3b8]">
              Comprehensive technical standards with verified government hotlines and clinical field calculations
            </p>
          </div>
          <button
            onClick={() => setSelectedCategory('all')}
            className="text-xs font-bold text-[#003366] dark:text-[#a7c8ff] hover:underline cursor-pointer"
          >
            View All ({DOWNLOADABLE_FILES.length})
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="card p-5 flex flex-col justify-between space-y-4 hover:border-[#003366] transition-colors border border-[#c3c6d1] dark:border-[#1f3c60] shadow-sm"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#f8f9ff] dark:bg-[#061324] border border-[#e2e8f0] dark:border-[#1f3c60] flex items-center justify-center text-lg shrink-0">
                  <i className={file.iconClass} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#0b1c30] dark:text-white leading-snug">
                    {file.title}
                  </h4>
                  <span className="text-[10px] text-[#737780] font-mono block mt-1">
                    {file.type}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDownload(file)}
                className="w-full btn btn-secondary py-2 px-3 text-xs flex items-center justify-center gap-2 hover:bg-emerald-50 dark:hover:bg-[#102a22] hover:text-emerald-600 font-semibold cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Protocol
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Common Questions FAQ Accordion (Curated + Community Answered) ──── */}
      <div className="card p-8 space-y-6 border border-[#c3c6d1] dark:border-[#1f3c60]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white font-headline">
              Common Questions (FAQs & Field Q&A)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Verified clinical answers and public questions approved by accredited Health Officers
            </p>
          </div>
          <span className="text-[11px] font-bold text-[#003366] dark:text-[#a7c8ff] bg-[#e5eeff] dark:bg-[#142c4a] px-3 py-1 rounded-full border border-[#799dd6]/30">
            {BASELINE_FAQS.length + publishedCommunityFaqs.length} Answers Available
          </span>
        </div>

        <div className="space-y-3">
          {/* Baseline FAQs */}
          {BASELINE_FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={`base-${index}`}
                className="rounded-xl border border-gray-200 dark:border-[#173b30] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 bg-gray-50/60 dark:bg-[#0b1f1a] hover:bg-gray-100 dark:hover:bg-[#102a22] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {faq.q}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 transition-transform">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>

                {isOpen && (
                  <div className="p-4 text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-white dark:bg-[#071613] border-t border-gray-100 dark:border-[#173b30] space-y-2">
                    <p>{faq.a}</p>
                    <div className="text-[10px] text-gray-400 font-semibold italic">
                      Source: {faq.source}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Community Published FAQs */}
          {publishedCommunityFaqs.map((q, idx) => {
            const faqIndex = BASELINE_FAQS.length + idx;
            const isOpen = openFaq === faqIndex;
            return (
              <div
                key={q._id}
                className="rounded-xl border border-emerald-200 dark:border-emerald-800/80 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : faqIndex)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">
                      Community Q&A
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {q.question}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 transition-transform">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>

                {isOpen && (
                  <div className="p-4 text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-white dark:bg-[#071613] border-t border-emerald-100 dark:border-emerald-900/40 space-y-2">
                    <p className="text-emerald-950 dark:text-emerald-100 font-medium">
                      {q.answer}
                    </p>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <i className="fa-solid fa-circle-check" />
                      <span>Verified by {q.answeredByName || 'Health Worker'} • {q.village}, {q.district}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Resources;
