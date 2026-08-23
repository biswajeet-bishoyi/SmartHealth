const HealthReport = require('../models/HealthReport');
const WaterReport = require('../models/WaterReport');
const RiskAssessment = require('../models/RiskAssessment');
const RiskConfig = require('../models/RiskConfig');

/**
 * ============================================================
 * RISK ENGINE — SmartHealthNE 2.0
 * ============================================================
 *
 * DISCLAIMER: All risk scores and thresholds are prototype/public-health
 * monitoring parameters. They are NOT medically validated diagnostic
 * thresholds. This system does not diagnose diseases.
 *
 * Formula (v1.0 core — preserved):
 *   currentRiskScore = symptomScore * 0.40
 *                    + growthScore  * 0.25
 *                    + waterScore   * 0.20
 *                    + clusterScore * 0.15
 *
 * Formula (v2.0 priority layer — new):
 *   priorityScore = currentRiskScore   * riskWeight
 *                 + environmentalRisk  * environmentalWeight
 *                 + vulnerabilityScore * vulnerabilityWeight
 *
 * Weights come from RiskConfig (admin-editable, audited). Defaults documented above.
 * ============================================================
 */

const mongoose = require('mongoose');

// ─── Config Cache ─────────────────────────────────────────────────────────────
let _configCache = null;
let _configCacheAt = 0;
const CONFIG_CACHE_TTL_MS = 60_000; // 1 minute cache

const DEFAULT_CONFIG = {
  weights: { symptom: 0.40, growth: 0.25, water: 0.20, cluster: 0.15 },
  priorityWeights: { risk: 0.60, environmental: 0.20, vulnerability: 0.20 },
  thresholds: { LOW: 30, MEDIUM: 60, HIGH: 80, CRITICAL: 100 },
  symptomWeights: { diarrhea: 3.0, vomiting: 2.5, dehydration: 3.0, fever: 1.5, abdominal_pain: 1.5, other: 1.0 },
  timeWindowDays: 7, clusterWindowHours: 48, clusterThreshold: 5,
  maxReportsForSymptom: 20, maxWaterReports: 10, maxGrowthRate: 200,
  minReportsForPrediction: 5, minHistoryDaysForPrediction: 7,
  modelVersion: 'risk-engine-v1',
};

const getConfig = async () => {
  const now = Date.now();
  if (_configCache && (now - _configCacheAt) < CONFIG_CACHE_TTL_MS) return _configCache;

  // If mongoose is not connected (e.g. in unit tests), return defaults immediately
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    return DEFAULT_CONFIG;
  }

  try {
    let config = await RiskConfig.findOne({ _singleton: 'risk_config' }).lean();
    if (!config) {
      config = await RiskConfig.create({ _singleton: 'risk_config' });
      config = config.toObject();
    }
    _configCache = config;
    _configCacheAt = now;
    return config;
  } catch (_) {
    return DEFAULT_CONFIG;
  }
};

/** Call this after admin updates RiskConfig to invalidate the cache. */
const invalidateConfigCache = () => { _configCache = null; };

// ─── Helper: normalize a raw value to 0–100 ──────────────────────────────────
const normalize = (value, max) => {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
};

// ─── Helper: get start date for N days ago ───────────────────────────────────
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── Risk Level from Score ────────────────────────────────────────────────────
const getRiskLevel = (score, thresholds = { LOW: 30, MEDIUM: 60, HIGH: 80, CRITICAL: 100 }) => {
  if (score <= thresholds.LOW)    return 'LOW';
  if (score <= thresholds.MEDIUM) return 'MEDIUM';
  if (score <= thresholds.HIGH)   return 'HIGH';
  return 'CRITICAL';
};

// ─── Component 1: Symptom Score ──────────────────────────────────────────────
/**
 * Supports both real DB reads and injected snapshot (for simulator).
 */
const calculateSymptomScore = async (village, district, config, injectedSnapshot) => {
  const since = daysAgo(config.timeWindowDays);
  const sw = config.symptomWeights;

  // Use injected snapshot if provided (for simulation)
  const additionalWeight = injectedSnapshot
    ? ((injectedSnapshot.additionalDiarrheaReports || 0) * (sw.diarrhea || 3.0) +
       (injectedSnapshot.additionalVomitingReports  || 0) * (sw.vomiting || 2.5) +
       (injectedSnapshot.additionalFeverReports     || 0) * (sw.fever    || 1.5)) *
      Math.max(1, injectedSnapshot.additionalAffectedPeople || 1)
    : 0;

  const reports = await HealthReport.find({
    village, district,
    createdAt: { $gte: since },
    status: { $ne: 'REJECTED' },
  }).select('symptoms affectedPeople').lean();

  let totalWeight = additionalWeight;
  for (const report of reports) {
    const multiplier = Math.max(1, report.affectedPeople || 1);
    for (const symptom of (report.symptoms || [])) {
      totalWeight += (sw[symptom] || 1.0) * multiplier;
    }
  }

  const maxWeight = config.maxReportsForSymptom * 3.0;
  return normalize(totalWeight, maxWeight);
};

// ─── Component 2: Growth Score ───────────────────────────────────────────────
const calculateGrowthScore = async (village, district, config) => {
  const now = new Date();
  const currentStart  = daysAgo(config.timeWindowDays);
  const previousStart = daysAgo(config.timeWindowDays * 2);

  const [currentCount, previousCount] = await Promise.all([
    HealthReport.countDocuments({ village, district, status: { $ne: 'REJECTED' }, createdAt: { $gte: currentStart, $lte: now } }),
    HealthReport.countDocuments({ village, district, status: { $ne: 'REJECTED' }, createdAt: { $gte: previousStart, $lt: currentStart } }),
  ]);

  if (previousCount === 0) {
    if (currentCount === 0) return 0;
    return normalize(currentCount * 16, 100);
  }

  const growthRate = ((currentCount - previousCount) / previousCount) * 100;
  return normalize(Math.max(0, growthRate), config.maxGrowthRate);
};

// ─── Component 3: Water Score ────────────────────────────────────────────────
const calculateWaterScore = async (village, district, config, injectedSnapshot) => {
  const since = daysAgo(config.timeWindowDays);

  const waterReports = await WaterReport.find({
    village, district,
    createdAt: { $gte: since },
  }).select('issueType severity').lean();

  const severityMultiplier = { LOW: 1, MEDIUM: 1.5, HIGH: 2, CRITICAL: 3 };
  const issueWeight = {
    dirty_water: 2, suspected_contamination: 3, flood_contamination: 3,
    bad_smell: 1.5, broken_water_source: 1, other: 1,
  };

  let totalScore = 0;
  for (const report of waterReports) {
    const sev   = severityMultiplier[report.severity] || 1;
    const issue = issueWeight[report.issueType] || 1;
    totalScore += sev * issue;
  }

  // Injection: if waterContaminationConfirmed, add a significant spike
  if (injectedSnapshot?.waterContaminationConfirmed) {
    totalScore += severityMultiplier.CRITICAL * issueWeight.suspected_contamination;
  }

  const maxScore = config.maxWaterReports * 3 * 3;
  return normalize(totalScore, maxScore);
};

// ─── Component 4: Cluster Score ──────────────────────────────────────────────
const calculateClusterScore = async (village, district, config) => {
  const since = new Date(Date.now() - config.clusterWindowHours * 60 * 60 * 1000);
  const recentCount = await HealthReport.countDocuments({
    village, district,
    status: { $ne: 'REJECTED' },
    createdAt: { $gte: since },
  });
  return normalize(recentCount, config.clusterThreshold);
};

// ─── Main: Calculate and Persist Risk for a Location ─────────────────────────
/**
 * Calculates the full risk score for a village/district and saves it.
 * Returns the saved RiskAssessment document.
 *
 * @param {{ village, district, state }} location
 * @param {{ environmentalRisk?, vulnerabilityScore?, injectedSnapshot?, triggeredByUserId? }} options
 *   - injectedSnapshot: if provided, used for simulation (no production DB write of the assessment)
 *   - The actual function ALWAYS writes a real RiskAssessment for the production path.
 *     For simulation, use simulationService which calls this with its own logic.
 */
const calculateForLocation = async ({ village, district, state }, options = {}) => {
  const {
    environmentalRisk  = 0,
    vulnerabilityScore = 0,
    triggeredByUserId  = null,
  } = options;

  const config = await getConfig();

  const [symptomScore, growthScore, waterScore, clusterScore] = await Promise.all([
    calculateSymptomScore(village, district, config, null),
    calculateGrowthScore(village, district, config),
    calculateWaterScore(village, district, config, null),
    calculateClusterScore(village, district, config),
  ]);

  const { weights, priorityWeights, thresholds } = config;

  // v1.0 core formula
  const riskScore = Math.round(
    symptomScore * weights.symptom  +
    growthScore  * weights.growth   +
    waterScore   * weights.water    +
    clusterScore * weights.cluster
  );

  // v2.0 priority formula
  const priorityScore = Math.round(
    riskScore         * (priorityWeights?.risk          || 0.60) +
    environmentalRisk * (priorityWeights?.environmental || 0.20) +
    vulnerabilityScore* (priorityWeights?.vulnerability || 0.20)
  );

  const riskLevel = getRiskLevel(riskScore, thresholds);

  const reportCount = await HealthReport.countDocuments({
    village, district,
    status: { $ne: 'REJECTED' },
    createdAt: { $gte: daysAgo(config.timeWindowDays) },
  });

  const assessment = await RiskAssessment.create({
    state, district, village,
    symptomScore:  Math.round(symptomScore),
    growthScore:   Math.round(growthScore),
    waterScore:    Math.round(waterScore),
    clusterScore:  Math.round(clusterScore),
    environmentalRisk:  Math.round(environmentalRisk),
    vulnerabilityScore: Math.round(vulnerabilityScore),
    weightsSnapshot:    weights,
    priorityWeightsSnapshot: priorityWeights || { risk: 0.60, environmental: 0.20, vulnerability: 0.20 },
    riskScore,
    priorityScore: Math.min(100, priorityScore),
    riskLevel,
    calculatedAt: new Date(),
    reportCount,
    modelVersion: config.modelVersion || 'risk-engine-v1',
    dataWindowDays: config.timeWindowDays,
  });

  // Generate explanation and data quality assessment asynchronously
  // (errors here must not block the main flow)
  setImmediate(async () => {
    try {
      const explanationService  = require('./explanationService');
      const dataQualityService  = require('./dataQualityService');
      const timelineService     = require('./timelineService');

      const [explanation] = await Promise.all([
        explanationService.generateForAssessment(assessment),
        dataQualityService.assess({ village, district, riskAssessmentId: assessment._id, reportCount }),
        timelineService.createEvent({
          village, district, state,
          eventType: 'RISK_CHANGE',
          summary: `Risk level updated to ${riskLevel} (score: ${riskScore}/100)`,
          relatedEntityId: assessment._id,
          relatedEntityType: 'RiskAssessment',
          riskLevel,
          actorId: triggeredByUserId,
        }),
      ]);

      if (explanation?._id) {
        await RiskAssessment.findByIdAndUpdate(assessment._id, { explanationId: explanation._id });
      }
    } catch (err) {
      console.error('[riskEngine] Post-assessment tasks failed:', err.message);
    }
  });

  return assessment;
};

/**
 * Get the latest risk assessment for each village.
 */
const getLatestByLocation = async (filter = {}) => {
  const matchStage = {};
  if (filter.state)     matchStage.state     = filter.state;
  if (filter.district)  matchStage.district  = filter.district;
  if (filter.riskLevel) matchStage.riskLevel = filter.riskLevel;

  const results = await RiskAssessment.aggregate([
    { $match: matchStage },
    { $sort: { calculatedAt: -1 } },
    {
      $group: {
        _id: { village: '$village', district: '$district' },
        latest: { $first: '$$ROOT' },
      },
    },
    { $replaceRoot: { newRoot: '$latest' } },
    { $sort: { priorityScore: -1, riskScore: -1 } },
  ]);

  return results;
};

module.exports = {
  calculateForLocation,
  getLatestByLocation,
  getRiskLevel,
  getConfig,
  invalidateConfigCache,
};
