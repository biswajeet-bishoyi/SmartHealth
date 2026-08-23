require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const HealthReport = require('../models/HealthReport');
const WaterReport = require('../models/WaterReport');
const RiskAssessment = require('../models/RiskAssessment');
const Alert = require('../models/Alert');
const AwarenessContent = require('../models/AwarenessContent');
const riskEngine = require('../services/riskEngine');
// v2.0 models
const VulnerabilityProfile   = require('../models/VulnerabilityProfile');
const WaterSource             = require('../models/WaterSource');
const EnvironmentalObservation= require('../models/EnvironmentalObservation');
const RiskConfig              = require('../models/RiskConfig');
const ResponsePlan            = require('../models/ResponsePlan');
const { Resource, ResourceAssignment } = require('../models/Resource');
const TimelineEvent           = require('../models/TimelineEvent');
const AuditLog                = require('../models/AuditLog');
const Prediction              = require('../models/Prediction');
const RiskExplanation         = require('../models/RiskExplanation');

// ─── Northeast India Locations ─────────────────────────────────────────────────
const LOCATIONS = [
  { state: 'Assam', district: 'Kamrup', village: 'Majuli Village', lat: 26.9194, lng: 91.7362 },
  { state: 'Assam', district: 'Kamrup', village: 'Barpeta Road', lat: 26.5023, lng: 90.9739 },
  { state: 'Assam', district: 'Jorhat', village: 'Teok', lat: 26.7459, lng: 94.2082 },
  { state: 'Assam', district: 'Jorhat', village: 'Mariani', lat: 26.6634, lng: 94.3128 },
  { state: 'Meghalaya', district: 'East Khasi Hills', village: 'Mawlai', lat: 25.5788, lng: 91.8933 },
  { state: 'Meghalaya', district: 'East Khasi Hills', village: 'Smit', lat: 25.6063, lng: 91.8400 },
  { state: 'Manipur', district: 'Imphal West', village: 'Nambol', lat: 24.7808, lng: 93.7630 },
  { state: 'Nagaland', district: 'Kohima', village: 'Viswema', lat: 25.6486, lng: 94.0939 },
  { state: 'Tripura', district: 'West Tripura', village: 'Jirania', lat: 23.8103, lng: 91.3882 },
  { state: 'Mizoram', district: 'Aizawl', village: 'Durtlang', lat: 23.7307, lng: 92.7173 },
];

const SYMPTOM_COMBOS = [
  ['diarrhea', 'vomiting'],
  ['diarrhea', 'vomiting', 'dehydration'],
  ['fever', 'abdominal_pain'],
  ['diarrhea', 'fever'],
  ['vomiting', 'dehydration'],
  ['diarrhea', 'abdominal_pain', 'fever'],
  ['fever'],
  ['diarrhea'],
  ['vomiting', 'fever', 'abdominal_pain'],
];

const WATER_SOURCES = ['river', 'well', 'hand_pump', 'tap', 'pond'];
const WATER_ISSUES_HEALTH = [['dirty_water'], ['no_issue'], ['suspected_contamination'], ['flood_contamination'], ['no_issue']];
const WATER_ISSUE_TYPES = ['dirty_water', 'bad_smell', 'flood_contamination', 'suspected_contamination', 'broken_water_source'];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

async function seedData() {
  console.log('🔄 Seeding database with Northeast demo data...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    HealthReport.deleteMany({}),
    WaterReport.deleteMany({}),
    RiskAssessment.deleteMany({}),
    Alert.deleteMany({}),
    AwarenessContent.deleteMany({}),
    // v2.0 collections
    VulnerabilityProfile.deleteMany({}),
    WaterSource.deleteMany({}),
    EnvironmentalObservation.deleteMany({}),
    RiskConfig.deleteMany({}),
    ResponsePlan.deleteMany({}),
    Resource.deleteMany({}),
    ResourceAssignment.deleteMany({}),
    TimelineEvent.deleteMany({}),
    AuditLog.deleteMany({}),
    Prediction.deleteMany({}),
    RiskExplanation.deleteMany({}),
  ]);
  console.log('🗑  Cleared existing data');

  // ─── Demo Accounts ──────────────────────────────────────────────────────────
  const demoPassword = 'Demo@1234';

  const [adminUser, workerUser, communityUser] = await User.create([
    {
      name: 'National Admin',
      email: 'admin@smarthealthne.demo',
      phone: '9999000001',
      password: demoPassword,
      role: 'NATIONAL_ADMIN',
      state: 'Assam',
      district: 'Kamrup',
      village: 'Guwahati',
      language: 'en',
    },
    {
      name: 'Dr. Priya Sharma',
      email: 'worker@smarthealthne.demo',
      phone: '9999000002',
      password: demoPassword,
      role: 'HEALTH_WORKER',
      state: 'Assam',
      district: 'Kamrup',
      village: 'Guwahati',
      language: 'en',
    },
    {
      name: 'Ranjit Das',
      email: 'community@smarthealthne.demo',
      phone: '9999000003',
      password: demoPassword,
      role: 'COMMUNITY_MEMBER',
      state: 'Assam',
      district: 'Kamrup',
      village: 'Majuli Village',
      language: 'as',
    },
  ]);
  console.log('👥 Demo accounts created');

  // ─── Additional Community Members ──────────────────────────────────────────
  const memberData = [];
  const memberNames = [
    'Anjali Borah', 'Bipul Kalita', 'Mina Devi', 'Rajen Nath', 'Sita Gogoi',
    'Hemanta Das', 'Purnima Baruah', 'Dilip Chetri', 'Kabita Boro', 'Nabin Hazarika',
    'Reena Devi', 'Subash Sharma', 'Amrit Singh', 'Lata Wangchuk', 'Mohan Thapa',
  ];
  for (let i = 0; i < memberNames.length; i++) {
    const loc = LOCATIONS[i % LOCATIONS.length];
    memberData.push({
      name: memberNames[i],
      email: `member${i + 1}@smarthealthne.demo`,
      phone: `99999${String(i).padStart(5, '0')}`,
      password: demoPassword,
      role: 'COMMUNITY_MEMBER',
      state: loc.state,
      district: loc.district,
      village: loc.village,
      language: rand(['en', 'hi', 'as', 'bn']),
    });
  }
  const members = await User.create(memberData);
  console.log(`👤 ${members.length} community members created`);

  // ─── Health Reports (65+ reports over 30 days) ─────────────────────────────
  const reportData = [];

  // Cluster in Majuli Village (last 7 days — HIGH risk scenario for demo)
  for (let i = 0; i < 22; i++) {
    reportData.push({
      userId: i < 3 ? communityUser._id : members[i % members.length]._id,
      state: 'Assam',
      district: 'Kamrup',
      village: 'Majuli Village',
      latitude: 26.9194 + (Math.random() - 0.5) * 0.01,
      longitude: 91.7362 + (Math.random() - 0.5) * 0.01,
      symptoms: rand(SYMPTOM_COMBOS.slice(0, 4)),
      duration: randInt(1, 5),
      affectedPeople: randInt(1, 6),
      waterSource: rand(['river', 'well', 'hand_pump']),
      waterIssues: rand([['dirty_water'], ['suspected_contamination'], ['flood_contamination']]),
      description: rand([
        'Water from the local well smells strange.',
        'Multiple people in our household fell sick after drinking well water.',
        'River water has changed color after the rains.',
        'Kids in the neighborhood are all having stomach problems.',
      ]),
      status: i < 5 ? 'VERIFIED' : 'PENDING',
      verifiedBy: i < 5 ? workerUser._id : undefined,
      verifiedAt: i < 5 ? daysAgo(randInt(0, 2)) : undefined,
      createdAt: daysAgo(randInt(0, 6)),
    });
  }

  // Reports from other locations
  for (const loc of LOCATIONS.slice(1)) {
    const count = randInt(3, 8);
    for (let i = 0; i < count; i++) {
      reportData.push({
        userId: members[randInt(0, members.length - 1)]._id,
        state: loc.state,
        district: loc.district,
        village: loc.village,
        latitude: loc.lat + (Math.random() - 0.5) * 0.02,
        longitude: loc.lng + (Math.random() - 0.5) * 0.02,
        symptoms: rand(SYMPTOM_COMBOS),
        duration: randInt(1, 7),
        affectedPeople: randInt(1, 4),
        waterSource: rand(WATER_SOURCES),
        waterIssues: rand(WATER_ISSUES_HEALTH),
        status: rand(['PENDING', 'VERIFIED', 'REJECTED']),
        createdAt: daysAgo(randInt(1, 29)),
      });
    }
  }

  await HealthReport.create(reportData);
  console.log(`📋 ${reportData.length} health reports created`);

  // ─── Water Reports (25+) ────────────────────────────────────────────────────
  const waterReportData = [];
  for (let i = 0; i < 12; i++) {
    waterReportData.push({
      state: 'Assam',
      district: 'Kamrup',
      village: 'Majuli Village',
      latitude: 26.9194 + (Math.random() - 0.5) * 0.01,
      longitude: 91.7362 + (Math.random() - 0.5) * 0.01,
      waterSource: rand(['river', 'well', 'hand_pump']),
      issueType: rand(['dirty_water', 'suspected_contamination', 'flood_contamination', 'bad_smell']),
      severity: rand(['MEDIUM', 'HIGH', 'CRITICAL']),
      description: rand([
        'Well water has turned yellow after recent floods.',
        'Strange smell coming from the hand pump.',
        'River flooding may have contaminated local wells.',
        'Water is murky and smells bad.',
      ]),
      reportedBy: rand([communityUser._id, ...members.slice(0, 5).map(m => m._id)]),
      createdAt: daysAgo(randInt(0, 7)),
    });
  }
  for (const loc of LOCATIONS.slice(1, 8)) {
    waterReportData.push({
      state: loc.state,
      district: loc.district,
      village: loc.village,
      waterSource: rand(WATER_SOURCES),
      issueType: rand(WATER_ISSUE_TYPES),
      severity: rand(['LOW', 'MEDIUM', 'HIGH']),
      reportedBy: members[randInt(0, members.length - 1)]._id,
      createdAt: daysAgo(randInt(1, 25)),
    });
  }

  await WaterReport.create(waterReportData);
  console.log(`💧 ${waterReportData.length} water reports created`);

  // ─── Risk Assessments ──────────────────────────────────────────────────────
  console.log('🔄 Calculating risk assessments...');
  for (const loc of LOCATIONS) {
    try {
      await riskEngine.calculateForLocation({
        village: loc.village,
        district: loc.district,
        state: loc.state,
      });
    } catch (e) {
      console.warn(`  ⚠ Risk calc failed for ${loc.village}: ${e.message}`);
    }
  }
  console.log('📊 Risk assessments calculated');

  // ─── Alerts ────────────────────────────────────────────────────────────────
  const majuliRisk = await RiskAssessment.findOne({ village: 'Majuli Village' }).sort({ calculatedAt: -1 });

  await Alert.create([
    {
      title: 'HIGH Risk Detected — Majuli Village, Kamrup',
      message: 'An elevated number of water-related health observation reports have been received from Majuli Village over the past 7 days. Risk score: 72/100. This is a public-health monitoring signal — not a medical diagnosis. Immediate field verification is recommended.',
      riskLevel: 'HIGH',
      state: 'Assam',
      district: 'Kamrup',
      village: 'Majuli Village',
      targetAudience: 'COMMUNITY',
      createdBy: workerUser._id,
      status: 'PENDING_REVIEW',
      riskAssessmentId: majuliRisk?._id,
      preventionActions: [
        'Boil all drinking water',
        'Avoid drinking from the local well until tested',
        'Report illness symptoms to health worker immediately',
        'Maintain strict hand hygiene',
      ],
      createdAt: daysAgo(1),
    },
    {
      title: 'MEDIUM Risk — Barpeta Road Area',
      message: 'Moderate increase in water-related illness reports in Barpeta Road. Public-health monitoring indicator only — not a diagnosis.',
      riskLevel: 'MEDIUM',
      state: 'Assam',
      district: 'Kamrup',
      village: 'Barpeta Road',
      targetAudience: 'HEALTH_WORKER',
      createdBy: workerUser._id,
      verifiedBy: workerUser._id,
      verifiedAt: daysAgo(5),
      approvedBy: adminUser._id,
      approvedAt: daysAgo(4),
      status: 'BROADCAST',
      broadcastAt: daysAgo(4),
      expiresAt: daysAgo(-3),
      preventionActions: [
        'Boil water before drinking',
        'Wash hands frequently',
      ],
      createdAt: daysAgo(6),
    },
    {
      title: 'Flood Contamination Warning — Teok',
      message: 'Water contamination risk following recent flooding. Community members should avoid river water.',
      riskLevel: 'HIGH',
      state: 'Assam',
      district: 'Jorhat',
      village: 'Teok',
      targetAudience: 'COMMUNITY',
      createdBy: workerUser._id,
      verifiedBy: workerUser._id,
      verifiedAt: daysAgo(2),
      status: 'VERIFIED',
      preventionActions: [
        'Do not drink river water',
        'Boil all water',
        'Seek medical attention if unwell',
      ],
      createdAt: daysAgo(3),
    },
  ]);
  console.log('🚨 Alerts created');

  // ─── Awareness Content ─────────────────────────────────────────────────────
  await AwarenessContent.create([
    {
      title: 'How to Make Water Safe to Drink',
      description: 'Boiling water is the most reliable method to make water safe. Bring water to a rolling boil for at least 1 minute (3 minutes at high altitude). Let it cool in a clean, covered container. You can also use water purification tablets available from your health worker.\n\nNote: This is general public-health education, not personalized medical advice.',
      category: 'Safe Water',
      language: 'en',
      source: 'WHO Guidelines for Drinking-water Quality',
      image: null,
      isPublished: true,
    },
    {
      title: 'Signs of Dehydration to Watch For',
      description: 'Dehydration can become serious quickly, especially in children. Warning signs include: dry mouth and throat, less frequent urination, dark yellow urine, feeling dizzy or faint, and dry skin.\n\nIf you or a family member shows these signs along with diarrhea or vomiting, contact your health worker immediately.\n\nThis information is for awareness only — it is not a diagnosis.',
      category: 'Emergency Warning Signs',
      language: 'en',
      source: 'National Health Mission',
      isPublished: true,
    },
    {
      title: 'Hand Washing: Your Best Defence',
      description: 'Washing hands with soap and water for at least 20 seconds can prevent many water-borne illnesses.\n\nWash hands:\n• Before eating or preparing food\n• After using the toilet\n• After caring for someone who is sick\n• After handling animals\n\nWhen soap is unavailable, use a hand sanitiser with at least 60% alcohol.',
      category: 'Hygiene',
      language: 'en',
      source: 'Ministry of Health and Family Welfare',
      isPublished: true,
    },
    {
      title: 'Safe Food Storage During Floods',
      description: 'During floods, food can become contaminated. Do not eat: food that has come into contact with flood water, food from damaged cans, or food with an unusual smell or appearance.\n\nSafe practices: Keep food covered, use sealed containers, avoid raw vegetables from flooded areas, and cook food thoroughly.',
      category: 'Food Safety',
      language: 'en',
      source: 'FSSAI (Food Safety and Standards Authority of India)',
      isPublished: true,
    },
    {
      title: 'Understanding Water-Borne Illnesses',
      description: 'Water-borne illnesses are caused by harmful microorganisms in contaminated water. Common symptoms include diarrhea, vomiting, stomach cramps, nausea, and fever.\n\nThese illnesses spread through: drinking contaminated water, eating food prepared with contaminated water, or contact with contaminated water.\n\nIMPORTANT: This information is for public-health education only. If you are experiencing symptoms, please contact your local health worker — do not self-diagnose.',
      category: 'Water-Borne Disease Awareness',
      language: 'en',
      source: 'National Centre for Disease Control',
      isPublished: true,
    },
    {
      title: 'पानी को पीने के लिए सुरक्षित कैसे बनाएं',
      description: 'पानी उबालना सबसे विश्वसनीय तरीका है। पानी को कम से कम 1 मिनट तक उबालें। ठंडा करके साफ ढके बर्तन में रखें। आप अपने स्वास्थ्य कार्यकर्ता से जल शुद्धिकरण की गोलियां भी ले सकते हैं।\n\nनोट: यह सामान्य जन-स्वास्थ्य जानकारी है, व्यक्तिगत चिकित्सा सलाह नहीं।',
      category: 'Safe Water',
      language: 'hi',
      source: 'WHO जल गुणवत्ता दिशानिर्देश',
      isPublished: true,
    },
    {
      title: 'हाथ धोना: आपकी सबसे अच्छी सुरक्षा',
      description: 'कम से कम 20 सेकंड के लिए साबुन और पानी से हाथ धोना जल-जनित बीमारियों को रोक सकता है।\n\nहाथ धोएं:\n• खाने से पहले\n• शौचालय के बाद\n• बीमार की देखभाल के बाद\n• जानवरों के बाद रखें\n\nजब साबुन उपलब्ध न हो, तो कम से कम 60% शराब वाले हैंड सैनिटाइज़र का प्रयोग करें।',
      category: 'Hygiene',
      language: 'hi',
      source: 'स्वास्थ्य और परिवार कल्याण मंत्रालय',
      isPublished: true,
    },
    {
      title: 'পানী পান কৰাৰ বাবে নিৰাপদ কেনেকৈ কৰিব',
      description: 'পানী উতলোৱা হৈছে আটাইতকৈ নিৰ্ভৰযোগ্য পদ্ধতি। কমেও ১ মিনিটৰ বাবে পানী উতলাওক। পৰিষ্কাৰ ঢকা পাত্ৰত ঠাণ্ডা কৰক।\n\nটোকা: এইটো সাধাৰণ স্বাস্থ্য শিক্ষা, ব্যক্তিগত চিকিৎসা পৰামৰ্শ নহয়।',
      category: 'Safe Water',
      language: 'as',
      source: 'WHO',
      isPublished: true,
    },
    {
      title: 'হাত ধোৱা: আপোনাৰ সৰ্বশ্ৰেষ্ঠ সুৰক্ষা',
      description: 'চাবোন আৰু পানীৰে কমেও ২০ ছেকেণ্ডৰ বাবে হাত ধোৱাটোৱে বহুতো পানী-বাহিত ৰোগ প্ৰতিৰোধ কৰিব পাৰে।',
      category: 'Hygiene',
      language: 'as',
      source: 'ৰাষ্ট্ৰীয় স্বাস্থ্য মিছন',
      isPublished: true,
    },
    {
      title: 'পানি পান করার জন্য নিরাপদ কীভাবে করবেন',
      description: 'পানি ফুটানো সবচেয়ে নির্ভরযোগ্য পদ্ধতি। কমপক্ষে ১ মিনিট ধরে পানি ফুটান। পরিষ্কার ঢাকা পাত্রে ঠান্ডা করুন।\n\nনোট: এটি সাধারণ জনস্বাস্থ্য শিক্ষা, ব্যক্তিগত চিকিৎসা পরামর্শ নয়।',
      category: 'Safe Water',
      language: 'bn',
      source: 'WHO',
      isPublished: true,
    },
    {
      title: 'হাত ধোয়া: আপনার সেরা সুরক্ষা',
      description: 'সাবান ও পানি দিয়ে কমপক্ষে ২০ সেকেন্ড হাত ধোয়া অনেক পানীবাহিত রোগ প্রতিরোধ করতে পারে।',
      category: 'Hygiene',
      language: 'bn',
      source: 'জাতীয় স্বাস্থ্য মিশন',
      isPublished: true,
    },
  ]);
  console.log('📚 Awareness content created');

  // ─────────────────────────────────────────────────────────────────────────────
  // v2.0 SEED DATA
  // ─────────────────────────────────────────────────────────────────────────────

  // ─── RiskConfig (default singleton) ─────────────────────────────────────────
  await RiskConfig.findOneAndUpdate(
    { _singleton: 'risk_config' },
    {
      _singleton: 'risk_config',
      weights: { symptom: 0.40, growth: 0.25, water: 0.20, cluster: 0.15 },
      priorityWeights: { risk: 0.60, environmental: 0.20, vulnerability: 0.20 },
      thresholds: { LOW: 30, MEDIUM: 60, HIGH: 80, CRITICAL: 100 },
      symptomWeights: { diarrhea: 3.0, vomiting: 2.5, dehydration: 3.0, fever: 1.5, abdominal_pain: 1.5, other: 1.0 },
      timeWindowDays: 7, clusterWindowHours: 48, clusterThreshold: 5,
      maxReportsForSymptom: 20, maxWaterReports: 10, maxGrowthRate: 200,
      minReportsForPrediction: 5, minHistoryDaysForPrediction: 7,
      modelVersion: 'risk-engine-v1',
      updatedBy: adminUser._id,
      version: 1,
    },
    { upsert: true, new: true }
  );
  console.log('⚙️  RiskConfig default created');

  // ─── VulnerabilityProfiles ───────────────────────────────────────────────────
  const vulnProfiles = await VulnerabilityProfile.create([
    {
      village: 'Majuli Village', district: 'Kamrup', state: 'Assam',
      population: 8500, householdCount: 1700,
      waterSourceDependencyScore: 85, priorIncidentCount: 3, floodSusceptibility: 90,
      sanitationIndicator: 30, distanceToHealthFacilityKm: 22, cleanWaterAccessScore: 25,
      environmentalExposureScore: 80,
      vulnerabilityScore: 78, vulnerabilityLevel: 'HIGH',
    },
    {
      village: 'Barpeta Road', district: 'Kamrup', state: 'Assam',
      population: 5200, householdCount: 1040,
      waterSourceDependencyScore: 60, priorIncidentCount: 1, floodSusceptibility: 45,
      sanitationIndicator: 55, distanceToHealthFacilityKm: 8, cleanWaterAccessScore: 60,
      environmentalExposureScore: 40,
      vulnerabilityScore: 42, vulnerabilityLevel: 'MEDIUM',
    },
    {
      village: 'Teok', district: 'Jorhat', state: 'Assam',
      population: 3200, householdCount: 640,
      waterSourceDependencyScore: 70, priorIncidentCount: 2, floodSusceptibility: 60,
      sanitationIndicator: 40, distanceToHealthFacilityKm: 15, cleanWaterAccessScore: 45,
      environmentalExposureScore: 55,
      vulnerabilityScore: 58, vulnerabilityLevel: 'MEDIUM',
    },
    {
      village: 'Mawlai', district: 'East Khasi Hills', state: 'Meghalaya',
      population: 4100, householdCount: 820,
      waterSourceDependencyScore: 50, priorIncidentCount: 0, floodSusceptibility: 30,
      sanitationIndicator: 70, distanceToHealthFacilityKm: 5, cleanWaterAccessScore: 75,
      environmentalExposureScore: 25,
      vulnerabilityScore: 25, vulnerabilityLevel: 'LOW',
    },
    {
      village: 'Nambol', district: 'Imphal West', state: 'Manipur',
      population: 6300, householdCount: 1260,
      waterSourceDependencyScore: 75, priorIncidentCount: 2, floodSusceptibility: 55,
      sanitationIndicator: 45, distanceToHealthFacilityKm: 18, cleanWaterAccessScore: 40,
      environmentalExposureScore: 60,
      vulnerabilityScore: 62, vulnerabilityLevel: 'HIGH',
    },
    {
      village: 'Viswema', district: 'Kohima', state: 'Nagaland',
      population: 2100, householdCount: 420,
      waterSourceDependencyScore: 80, priorIncidentCount: 1, floodSusceptibility: 20,
      sanitationIndicator: 60, distanceToHealthFacilityKm: 12, cleanWaterAccessScore: 55,
      environmentalExposureScore: 30,
      vulnerabilityScore: 44, vulnerabilityLevel: 'MEDIUM',
    },
    {
      village: 'Jirania', district: 'West Tripura', state: 'Tripura',
      population: 7200, householdCount: 1440,
      waterSourceDependencyScore: 65, priorIncidentCount: 2, floodSusceptibility: 70,
      sanitationIndicator: 35, distanceToHealthFacilityKm: 20, cleanWaterAccessScore: 35,
      environmentalExposureScore: 65,
      vulnerabilityScore: 66, vulnerabilityLevel: 'HIGH',
    },
    {
      village: 'Durtlang', district: 'Aizawl', state: 'Mizoram',
      population: 3500, householdCount: 700,
      waterSourceDependencyScore: 40, priorIncidentCount: 0, floodSusceptibility: 15,
      sanitationIndicator: 80, distanceToHealthFacilityKm: 4, cleanWaterAccessScore: 82,
      environmentalExposureScore: 20,
      vulnerabilityScore: 18, vulnerabilityLevel: 'LOW',
    },
  ]);
  console.log(`🏘️  VulnerabilityProfiles created (${vulnProfiles.length})`);

  // ─── WaterSources ───────────────────────────────────────────────────────────
  const waterSources = await WaterSource.create([
    {
      name: 'Majuli Main River Intake', type: 'river',
      village: 'Majuli Village', district: 'Kamrup', state: 'Assam',
      latitude: 26.9200, longitude: 91.7370, connectedPopulation: 3500,
      status: 'INVESTIGATION_REQUIRED',
      currentRiskScore: 72, currentRiskLevel: 'HIGH',
      totalReportCount: 8, contaminationReportCount: 5,
      lastInspectionAt: daysAgo(14), lastInspectionResult: 'Visible turbidity, flood sediment detected',
    },
    {
      name: 'Majuli Hand Pump Cluster (North)', type: 'hand_pump',
      village: 'Majuli Village', district: 'Kamrup', state: 'Assam',
      latitude: 26.9210, longitude: 91.7380, connectedPopulation: 1200,
      status: 'ACTIVE',
      currentRiskScore: 38, currentRiskLevel: 'MEDIUM',
      totalReportCount: 3, contaminationReportCount: 1,
    },
    {
      name: 'Barpeta Piped Supply (Ward 3)', type: 'piped_supply',
      village: 'Barpeta Road', district: 'Kamrup', state: 'Assam',
      connectedPopulation: 2400,
      status: 'ACTIVE',
      currentRiskScore: 15, currentRiskLevel: 'LOW',
      totalReportCount: 1, contaminationReportCount: 0,
    },
    {
      name: 'Teok Pond (Village)', type: 'pond',
      village: 'Teok', district: 'Jorhat', state: 'Assam',
      connectedPopulation: 800,
      status: 'INVESTIGATION_REQUIRED',
      currentRiskScore: 55, currentRiskLevel: 'MEDIUM',
      totalReportCount: 4, contaminationReportCount: 2,
      lastInspectionAt: daysAgo(7), lastInspectionResult: 'Algae bloom observed, advised boiling',
    },
    {
      name: 'Nambol Well (Central)', type: 'well',
      village: 'Nambol', district: 'Imphal West', state: 'Manipur',
      connectedPopulation: 1600,
      status: 'ACTIVE',
      currentRiskScore: 28, currentRiskLevel: 'LOW',
      totalReportCount: 2, contaminationReportCount: 0,
    },
  ]);
  console.log(`💧 WaterSources created (${waterSources.length})`);

  // ─── EnvironmentalObservations (Majuli flood scenario) ───────────────────────
  // These are time-correlated with the risk escalation — key for the 23-step demo
  await EnvironmentalObservation.create([
    {
      village: 'Majuli Village', district: 'Kamrup', state: 'Assam',
      observationType: 'RAINFALL', value: 142, severity: 'HIGH',
      isHeavyRainfall: true, isFloodEvent: false,
      source: 'MOCK_SEED', isMock: true,
      description: 'Heavy monsoon rainfall (142mm in 24h) — mock data',
      observedAt: daysAgo(5),
    },
    {
      village: 'Majuli Village', district: 'Kamrup', state: 'Assam',
      observationType: 'FLOOD', value: 1, severity: 'CRITICAL',
      isHeavyRainfall: false, isFloodEvent: true,
      source: 'MOCK_SEED', isMock: true,
      description: 'Brahmaputra floodwaters reached village outskirts — mock data',
      observedAt: daysAgo(3),
    },
    {
      village: 'Majuli Village', district: 'Kamrup', state: 'Assam',
      observationType: 'CONTAMINATION_RISK', value: 85, severity: 'HIGH',
      isHeavyRainfall: false, isFloodEvent: false,
      source: 'MOCK_SEED', isMock: true,
      description: 'Post-flood: river intake at high contamination risk — mock data',
      observedAt: daysAgo(2),
    },
    {
      village: 'Jorhat', district: 'Jorhat', state: 'Assam',
      observationType: 'RAINFALL', value: 78, severity: 'MEDIUM',
      isHeavyRainfall: false, isFloodEvent: false,
      source: 'MOCK_SEED', isMock: true,
      description: 'Moderate rainfall — mock data',
      observedAt: daysAgo(4),
    },
    {
      village: 'Nambol', district: 'Imphal West', state: 'Manipur',
      observationType: 'RAINFALL', value: 55, severity: 'MEDIUM',
      isHeavyRainfall: false, isFloodEvent: false,
      source: 'MOCK_SEED', isMock: true,
      description: 'Moderate pre-monsoon rainfall — mock data',
      observedAt: daysAgo(6),
    },
    {
      village: 'Jirania', district: 'West Tripura', state: 'Tripura',
      observationType: 'FLOOD', value: 1, severity: 'HIGH',
      isHeavyRainfall: false, isFloodEvent: true,
      source: 'MOCK_SEED', isMock: true,
      description: 'Low-lying flood event in Jirania — mock data',
      observedAt: daysAgo(8),
    },
  ]);
  console.log('🌧️  EnvironmentalObservations created');

  // ─── Resources ────────────────────────────────────────────────────────────────
  const resources = await Resource.create([
    { type: 'HEALTH_WORKER', name: 'Field Team Alpha', capacity: 3, currentAssignmentStatus: 'ASSIGNED', homeDistrict: 'Kamrup', homeState: 'Assam' },
    { type: 'WATER_TESTING_TEAM', name: 'Water Lab Unit 1', capacity: 4, currentAssignmentStatus: 'ON_SITE', homeDistrict: 'Kamrup', homeState: 'Assam' },
    { type: 'INSPECTION_TEAM', name: 'Sanitation Inspection Team B', capacity: 2, currentAssignmentStatus: 'AVAILABLE', homeDistrict: 'Jorhat', homeState: 'Assam' },
    { type: 'AWARENESS_TEAM', name: 'Community Awareness Squad 1', capacity: 5, currentAssignmentStatus: 'AVAILABLE', homeDistrict: 'Imphal West', homeState: 'Manipur' },
    { type: 'SUPPLY_PACK', name: 'ORS + Chlorine Kit A', capacity: 500, currentAssignmentStatus: 'ASSIGNED', homeDistrict: 'Kamrup', homeState: 'Assam' },
    { type: 'EMERGENCY_RESPONSE_TEAM', name: 'Emergency Response Unit 1', capacity: 8, currentAssignmentStatus: 'AVAILABLE', homeDistrict: 'Kamrup', homeState: 'Assam' },
  ]);
  console.log(`🚑 Resources created (${resources.length})`);

  console.log('\n🎉 Seed complete!\n');
  console.log('Demo accounts:');
  console.log('  Community: community@smarthealthne.demo / Demo@1234');
  console.log('  Health Worker: worker@smarthealthne.demo / Demo@1234');
  console.log('  Admin: admin@smarthealthne.demo / Demo@1234\n');
  console.log('  Golden-path demo village: Majuli Village, Kamrup district');
  console.log('  Key scenario: HIGH environmental risk + CRITICAL water source + vulnerability score 78/100');
  console.log('  Run the 23-step SIH demo scenario starting from this location.\n');
}

async function runStandalone() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smarthealthne');
    console.log('✅ Connected to MongoDB');
    await seedData();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runStandalone();
}

module.exports = { seedData };