import React, { useState } from 'react';

const CATEGORIES = [
  { id: 'water', label: 'Water Safety', iconClass: 'fa-solid fa-water', desc: 'Purification, testing, and storage methods' },
  { id: 'disease', label: 'Disease Prevention', iconClass: 'fa-solid fa-shield-halved', desc: 'Hygiene practices and symptom detection' },
  { id: 'emergency', label: 'Emergency Action', iconClass: 'fa-solid fa-truck-medical', desc: 'Outbreak protocols and hotline directory' },
];

const DOWNLOADABLE_FILES = [
  {
    id: 1,
    title: 'Water Purification Guide',
    type: 'TXT • 2KB',
    iconClass: 'fa-solid fa-file-lines text-blue-500',
    category: 'water',
    content: '1. Bring water to a rolling boil for 1 minute.\n2. Store in clean, covered containers.\n3. Use chlorine tablets per WHO dosage.',
  },
  {
    id: 2,
    title: 'Standard Sanitation Protocols',
    type: 'PDF • 1.4MB',
    iconClass: 'fa-solid fa-file-pdf text-rose-500',
    category: 'disease',
    content: 'Community sanitation guidelines for health workers and rural households.',
  },
  {
    id: 3,
    title: 'Emergency Contact Directory',
    type: 'PDF • 340KB',
    iconClass: 'fa-solid fa-phone text-emerald-500',
    category: 'emergency',
    content: 'National & District Health Helpline numbers across Assam, Meghalaya, Manipur.',
  },
  {
    id: 4,
    title: 'Malaria & Water-borne Prevention Steps',
    type: 'DOC • 520KB',
    iconClass: 'fa-solid fa-file-medical text-purple-500',
    category: 'disease',
    content: 'Vector control and clean water maintenance steps.',
  },
];

const FAQS = [
  {
    q: 'Where can I get water purification or chlorine tablets?',
    a: 'Chlorine purification tablets (Halazone / NaDCC) are distributed free of charge by your accredited local ASHA / Health Worker at the nearest Primary Health Centre (PHC).',
  },
  {
    q: 'What should I do if my local well water turns yellow or smells strange?',
    a: 'Immediately stop drinking untreated water from that source. Use the SmartHealthNE "Report" tab to submit a water quality issue so field inspectors can conduct a water sample test.',
  },
  {
    q: 'How long should drinking water be boiled to ensure it is safe?',
    a: 'Bring water to a rolling boil for at least 1 full minute (3 minutes at higher altitudes). Let it cool naturally in a clean, covered container.',
  },
  {
    q: 'What are the primary early warning signs of water-borne dehydration?',
    a: 'Excessive thirst, dry mouth, sunken eyes, infrequent urination with dark urine, dizziness, and extreme fatigue. Administer Oral Rehydration Salts (ORS) immediately and visit your health worker.',
  },
];

const Resources = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openFaq, setOpenFaq] = useState(0);

  const handleDownload = (file) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.title.replace(/\s+/g, '_')}.txt`;
    a.click();
  };

  const filteredFiles =
    selectedCategory === 'all'
      ? DOWNLOADABLE_FILES
      : DOWNLOADABLE_FILES.filter((f) => f.category === selectedCategory);

  return (
    <div className="space-y-10">
      {/* ─── Hero Banner ────────────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg border border-[#003366] bg-gradient-to-r from-[#001e40] via-[#002d5c] to-[#00142b] text-white p-8 sm:p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#003366] text-[#a7c8ff] border border-[#799dd6]/30 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#6cf8bb] animate-pulse" />
              EDUCATIONAL HUB
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-headline">
              Public Health <span className="text-[#a7c8ff] block sm:inline">Knowledge Center</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#cbdbf5] leading-relaxed">
              Access vital safety guidelines, download official protocols, and find emergency contacts for your region.
            </p>
          </div>

          <div className="flex items-center gap-4 self-start md:self-auto">
            <div className="p-3.5 bg-[#00142b] rounded-xl border border-[#003366] text-center">
              <div className="text-sm font-extrabold text-white font-headline">24/7</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#a7c8ff]">
                HELPLINE
              </div>
            </div>
            <div className="p-3.5 bg-[#00142b] rounded-xl border border-[#003366] text-center">
              <div className="text-sm font-extrabold text-white font-headline">12+</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#a7c8ff]">
                PROTOCOLS
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Category Shortcuts Row (3 cards) ─────────────────────────────────── */}
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
              <p className="text-xs text-[#737780] mt-1">
                {cat.desc}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* ─── Resource Library & Video Tutorial Grid ──────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#0b1c30] dark:text-white font-headline">
              Resource Library
            </h3>
            <p className="text-xs text-[#737780]">
              Downloadable protocols and field reference materials
            </p>
          </div>
          <button
            onClick={() => setSelectedCategory('all')}
            className="text-xs font-bold text-[#003366] dark:text-[#a7c8ff] hover:underline cursor-pointer"
          >
            View All ({DOWNLOADABLE_FILES.length})
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Downloadable file cards (left 7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="card p-5 flex flex-col justify-between space-y-4 hover:border-[#003366] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#f8f9ff] dark:bg-[#061324] border border-[#e2e8f0] dark:border-[#1f3c60] flex items-center justify-center text-lg shrink-0">
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
                </div>

                <button
                  onClick={() => handleDownload(file)}
                  className="w-full btn btn-secondary py-2 px-3 text-xs flex items-center justify-center gap-2 hover:bg-emerald-50 dark:hover:bg-[#102a22] hover:text-emerald-600 font-semibold"
                >
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Guide
                </button>
              </div>
            ))}
          </div>

          {/* Video Tutorial Card (right 5 cols) */}
          <div className="lg:col-span-5 card p-6 bg-gradient-to-br from-[#001e40] via-[#002d5c] to-[#00142b] text-white border border-[#003366] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="relative w-full h-36 rounded-xl bg-black/40 border border-emerald-500/20 overflow-hidden flex items-center justify-center group cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-lg pl-1 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                  ▶
                </div>
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono font-bold">
                  5:20
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-white">Hygiene Tutorial</h4>
                <p className="text-xs text-emerald-100/80 leading-relaxed mt-1">
                  Watch our detailed 5-minute guide on proper water sanitation techniques for rural households.
                </p>
              </div>
            </div>

            <button
              onClick={() => alert('▶ Starting Hygiene & Sanitation Video Tutorial...')}
              className="w-full btn btn-primary py-2.5 text-xs font-bold shadow-md"
            >
              Watch Now ▶
            </button>
          </div>
        </div>
      </div>

      {/* ─── Common Questions FAQ Accordion ───────────────────────────────────── */}
      <div className="card p-8 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Common Questions
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Quick answers to the most frequent community concerns
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-gray-200 dark:border-[#173b30] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 bg-gray-50/60 dark:bg-[#0b1f1a] hover:bg-gray-100 dark:hover:bg-[#102a22] transition-colors"
                >
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {faq.q}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 transition-transform">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>

                {isOpen && (
                  <div className="p-4 text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-white dark:bg-[#071613] border-t border-gray-100 dark:border-[#173b30]">
                    {faq.a}
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
