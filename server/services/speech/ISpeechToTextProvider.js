/**
 * ISpeechToTextProvider.js + mockSpeechToTextProvider.js
 * -------------------------------------------------------
 * Interface and mock implementation for voice-to-structured-report extraction.
 *
 * PROTOTYPE DISCLAIMER: Voice extraction uses rule/keyword-based parsing —
 * not a validated NLP system. Always shows confidence and requires user
 * confirmation before submission.
 */

// ─── Interface ────────────────────────────────────────────────────────────────
class ISpeechToTextProvider {
  async transcribe(audioBlob) {
    throw new Error('ISpeechToTextProvider.transcribe() must be implemented');
  }
  isMock() { return true; }
  providerName() { return 'Unknown STT Provider'; }
}

// ─── Multilingual Rule/Keyword Extractor (English, Hindi, Bengali, Assamese) ───
const SYMPTOM_KEYWORDS = {
  diarrhea: [
    'diarrhea', 'diarrhoea', 'loose motion', 'loose stool', 'watery stool',
    'पेट खराब', 'दस्त', 'হাগা', 'ডায়রিয়া', 'পনীয়া শৌচ', 'পেট চলা',
  ],
  vomiting: [
    'vomiting', 'vomit', 'nausea', 'throwing up', 'puke',
    'उल्टी', 'जी मिचलाना', 'বমি', 'বমি বমি ভাব', 'বমি হোৱা',
  ],
  dehydration: [
    'dehydration', 'dehydrated', 'weakness', 'very thirsty', 'dry mouth',
    'निर्जलीकरण', 'कमजोरी', 'পানিশূন্যতা', 'শুকান মুখ',
  ],
  fever: [
    'fever', 'high temperature', 'chills', 'shivering',
    'बुखार', 'ताप', 'জ্বর', 'জ্বৰ', 'গা গৰম',
  ],
  abdominal_pain: [
    'stomach pain', 'abdominal pain', 'belly pain', 'cramps', 'stomach ache',
    'पेट दर्द', 'मरोड़', 'পেটে ব্যথা', 'পেটৰ বিষ', 'পেট কামোৰণি',
  ],
  skin_rash: [
    'rash', 'skin rash', 'itching', 'skin infection',
    'खुजली', 'चकत्ते', 'চামড়াৰ ৰোগ', 'খজুৱতি',
  ],
  fatigue: [
    'tired', 'fatigue', 'extreme fatigue', 'exhausted',
    'थकान', 'দুর্বলতা', 'ভাগৰুৱা',
  ],
};

const NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  एक: 1, दो: 2, तीन: 3, चार: 4, पाँच: 5,
  এক: 1, দুই: 2, তিন: 3, চার: 4, পাঁচ: 5,
  এটা: 1, দুটা: 2, তিনিটা: 3, চাৰিটা: 4, পাঁচটা: 5,
};

const KNOWN_LOCATIONS = [
  { village: 'Majuli Village', district: 'Kamrup', state: 'Assam', keywords: ['majuli', 'মাজুলী', 'माजुली'] },
  { village: 'Barpeta Town', district: 'Barpeta', state: 'Assam', keywords: ['barpeta', 'বৰপেটা', 'बरपेटा'] },
  { village: 'Nambol', district: 'Bishnupur', state: 'Manipur', keywords: ['nambol', 'নাম্বল', 'नाम्बोल'] },
  { village: 'Imphal', district: 'Imphal West', state: 'Manipur', keywords: ['imphal', 'ইম্ফল', 'इम्फाल'] },
  { village: 'Dhemaji', district: 'Dhemaji', state: 'Assam', keywords: ['dhemaji', 'ধেমাঝি', 'धेमाजी'] },
  { village: 'Nalbari', district: 'Nalbari', state: 'Assam', keywords: ['nalbari', 'নলবাৰী', 'नलबाड़ी'] },
  { village: 'Silchar', district: 'Cachar', state: 'Assam', keywords: ['silchar', 'শিলচৰ', 'सिलचर', 'cachar'] },
  { village: 'Tezpur', district: 'Sonitpur', state: 'Assam', keywords: ['tezpur', 'তেজপুৰ', 'तेজपुर', 'sonitpur'] },
  { village: 'Jorhat', district: 'Jorhat', state: 'Assam', keywords: ['jorhat', 'যোৰহাট', 'जोरहाट'] },
  { village: 'Dhubri', district: 'Dhubri', state: 'Assam', keywords: ['dhubri', 'ধুবুৰী', 'धुबरी'] },
  { village: 'Guwahati', district: 'Kamrup Metro', state: 'Assam', keywords: ['guwahati', 'গুৱাহাটী', 'गुवाहाटी', 'kamrup'] },
  { village: 'Nagaon', district: 'Nagaon', state: 'Assam', keywords: ['nagaon', 'নগাঁও', 'नगांव'] },
  { village: 'Shillong', district: 'East Khasi Hills', state: 'Meghalaya', keywords: ['shillong', 'শিলং'] },
  { village: 'Kohima', district: 'Kohima', state: 'Nagaland', keywords: ['kohima'] },
  { village: 'Aizawl', district: 'Aizawl', state: 'Mizoram', keywords: ['aizawl'] },
  { village: 'Agartala', district: 'West Tripura', state: 'Tripura', keywords: ['agartala', 'আগরতলা'] },
];

const WATER_KEYWORDS = {
  well: ['well', 'tube well', 'tubewell', 'community well', 'कुआं', 'পাতকুঁৱা', 'কুয়ো'],
  river: ['river', 'brahmaputra', 'flood', 'floodwater', 'flood water', 'নদী', 'নৈ', 'नदी', 'बाढ़'],
  tap: ['tap', 'pipe', 'supply water', 'tap water', 'नल', 'পানীৰ কল', 'ট্যাপ'],
  pond: ['pond', 'pukhuri', 'lake', 'surface water', 'পুকুৰ', 'পুখুৰী', 'तालाब'],
  hand_pump: ['hand pump', 'handpump', 'चापाकल', 'দমকল'],
};

/**
 * Extract structured report fields from a transcript.
 * Returns: { symptoms, affectedPeople, duration, village, district, state, waterSource, confidence }
 */
const extractFields = (transcript, userContext = {}) => {
  const text = (transcript || '').toLowerCase();
  const symptoms = [];

  for (const [symptom, keywords] of Object.entries(SYMPTOM_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw.toLowerCase()))) {
      symptoms.push(symptom);
    }
  }

  // Extract number of affected people
  let affectedPeople = 1;
  const numMatch = text.match(/(\d+)\s*(?:people|persons|members|family|households?|children|kids|patients|cases|adults)?/);
  if (numMatch && parseInt(numMatch[1], 10) > 0) {
    affectedPeople = parseInt(numMatch[1], 10);
  } else {
    for (const [word, num] of Object.entries(NUMBER_WORDS)) {
      if (text.includes(word)) {
        affectedPeople = num;
        break;
      }
    }
  }

  // Extract duration
  let duration = 1;
  const dayMatch = text.match(/(?:last|past|since)?\s*(\d+)\s*days?/);
  if (dayMatch && parseInt(dayMatch[1], 10) > 0) {
    duration = parseInt(dayMatch[1], 10);
  } else if (text.includes('yesterday') || text.includes('since last night') || text.includes('কালকে') || text.includes('কালি')) {
    duration = 1;
  } else if (text.includes('week') || text.includes('सप्ताह') || text.includes('সপ্তাহ')) {
    duration = 7;
  }

  // Extract Location (Region / Village / District)
  let village = userContext.village || 'Majuli Village';
  let district = userContext.district || 'Kamrup';
  let state = userContext.state || 'Assam';

  let foundLocation = false;
  for (const loc of KNOWN_LOCATIONS) {
    if (loc.keywords.some(kw => text.includes(kw.toLowerCase()))) {
      village = loc.village;
      district = loc.district;
      state = loc.state;
      foundLocation = true;
      break;
    }
  }

  // If not matched directly in known list, detect "in <Location>" or "at <Location>"
  if (!foundLocation) {
    const locMatch = text.match(/(?:in|at|near|from)\s+([a-zA-Z\u0900-\u097F\u0980-\u09FF]{3,20})/i);
    if (locMatch && locMatch[1]) {
      const candidate = locMatch[1].trim();
      const stopWords = ['the', 'my', 'our', 'last', 'past', 'two', 'three', 'four', 'five', 'days', 'yesterday', 'severe', 'acute', 'water', 'flood'];
      if (!stopWords.includes(candidate.toLowerCase())) {
        village = candidate.charAt(0).toUpperCase() + candidate.slice(1);
        district = userContext.district || 'Kamrup';
      }
    }
  }

  // Extract water source
  let waterSource = 'tap';
  for (const [ws, keywords] of Object.entries(WATER_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw.toLowerCase()))) {
      waterSource = ws;
      break;
    }
  }

  // Compute confidence based on how much was extracted
  let confidence = 0;
  if (symptoms.length > 0)     confidence += 40;
  if (affectedPeople > 1)      confidence += 20;
  if (duration > 0)            confidence += 10;
  if (village)                 confidence += 15;
  if (waterSource !== 'tap')   confidence += 15;
  confidence = Math.min(100, Math.max(40, confidence));

  return {
    symptoms,
    affectedPeople,
    duration,
    village,
    district,
    state,
    waterSource,
    confidence,
  };
};

// ─── Mock STT Provider ────────────────────────────────────────────────────────
class MockSpeechToTextProvider extends ISpeechToTextProvider {
  isMock()       { return true; }
  providerName() { return 'MockSpeechToTextProvider (prototype — rule-based extraction)'; }

  async transcribe(text) {
    return { transcript: text, isMock: true };
  }
}

const mockSpeechProvider = new MockSpeechToTextProvider();

module.exports = { ISpeechToTextProvider, mockSpeechProvider, extractFields };
