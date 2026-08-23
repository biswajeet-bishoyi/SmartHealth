/**
 * predictionEngine.js
 * -------------------
 * Deterministic statistical trend extrapolation for 3–7 day risk forecasting.
 * Implements the IForecastModel interface for future ML model swap.
 *
 * PROTOTYPE DISCLAIMER: This is an experimental/public-health forecasting model.
 * Output is statistical extrapolation — NOT medically validated diagnostic prediction.
 * Always shows confidence score and model version in UI.
 */

const HealthReport = require('../models/HealthReport');
const WaterReport = require('../models/WaterReport');
const Prediction = require('../models/Prediction');
const RiskConfig = require('../models/RiskConfig');
const environmentalRiskService = require('./environmentalRiskService');
const vulnerabilityService = require('./vulnerabilityService');
const explanationService = require('./explanationService');

const MODEL_VERSION = 'statistical-trend-v1';

const getRiskLevel = (score) => {
  if (score <= 30) return 'LOW';
  if (score <= 60) return 'MEDIUM';
  if (score <= 80) return 'HIGH';
  return 'CRITICAL';
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Calculate weekly trend percentage
 * @param {Object} current - current week's aggregated data
 * @param {Object} previous - previous week's data
 * @returns {number} trend score (0-100)
 */
function calculateWeeklyTrend(current, previous) {
  if (!previous || !previous.totalCases || previous.totalCases === 0) {
    return 0; // Safe fallback
  }
  const change = (current?.totalCases || 0) - previous.totalCases;
  const trend = (change / previous.totalCases) * 100;
  return Math.max(0, Math.min(trend, 100));
}

/**
 * Calculate simple confidence score based on report counts
 * @param {number} reportCount - number of recent reports
 * @returns {number} confidence (0-100)
 */
function calculateConfidence(reportCount) {
  if (!reportCount || reportCount < 3) return 40;
  if (reportCount >= 10) return 90;
  return Math.min(100, (reportCount * 10) + 20);
}

/**
 * Compute multi-horizon confidence score based on data sufficiency.
 * NOT a hard-coded placeholder.
 */
const computeConfidence = (reportCount7d, reportCount14d, reportCount30d, historicalSeasons = 0) => {
  let confidence = 0;
  // Up to 40 points for recent data volume
  if (reportCount7d >= 10) confidence += 40;
  else if (reportCount7d >= 5) confidence += 25;
  else confidence += (reportCount7d || 0) * 4;

  // Up to 30 points for 14-day history
  if (reportCount14d >= 15) confidence += 30;
  else if (reportCount14d >= 8) confidence += 20;
  else confidence += (reportCount14d || 0) * 2;

  // Up to 20 points for 30-day history
  if (reportCount30d >= 30) confidence += 20;
  else if (reportCount30d >= 15) confidence += 12;
  else confidence += Math.min(10, reportCount30d || 0);

  // Up to 10 points if seasonal data exists
  if (historicalSeasons > 0) confidence += 10;

  return Math.min(100, Math.round(confidence));
};

/**
 * Pure helper to calculate prediction given an in-memory inputSnapshot (unit-testable)
 */
function calculatePrediction(inputSnapshot) {
  if (!inputSnapshot || (inputSnapshot.reportCount !== undefined && inputSnapshot.reportCount < 5)) {
    return {
      success: false,
      data: {
        insufficientData: true,
        prediction: null,
        reason: 'Insufficient historical data (less than 5 reports)',
      },
      status: 'EXPERIMENTAL',
    };
  }

  const weeklyReports = inputSnapshot.weeklyReports || [];
  const lastWeek = weeklyReports[weeklyReports.length - 1] || { totalCases: inputSnapshot.reportCount || 0 };
  const prevWeek = weeklyReports[weeklyReports.length - 2] || { totalCases: 0 };

  const trend = calculateWeeklyTrend(lastWeek, prevWeek);
  const environmentalFactor = inputSnapshot.environmentalRisk || 0;
  const predictionScore = Math.min(100, Math.round(trend * 0.5 + environmentalFactor * 0.5));
  const confidence = calculateConfidence(inputSnapshot.reportCount || 5);

  return {
    success: true,
    data: {
      prediction: predictionScore,
      confidence: confidence,
      modelVersion: MODEL_VERSION,
      inputsSnapshot: JSON.stringify(inputSnapshot),
    },
    status: 'EXPERIMENTAL', // COMPLIANCE: Always label as prototype
  };
}

/**
 * IForecastModel.predict() implementation.
 * @param {{ village, district, state, currentRiskScore, currentRiskLevel, windowDays }} inputs
 * @returns {Prediction} saved prediction document
 */
const predict = async ({ village, district, state, currentRiskScore, currentRiskLevel, windowDays = 7 }) => {
  let config;
  try {
    config = await RiskConfig.findOne({ _singleton: 'risk_config' }).lean();
  } catch (_) {}
  const minReports    = config?.minReportsForPrediction || 5;
  const minHistoryDays= config?.minHistoryDaysForPrediction || 7;

  // Gather report counts at different time horizons
  const [count7d, count14d, count30d, countPrev7d] = await Promise.all([
    HealthReport.countDocuments({ village, district, status: { $ne: 'REJECTED' }, createdAt: { $gte: daysAgo(7) } }),
    HealthReport.countDocuments({ village, district, status: { $ne: 'REJECTED' }, createdAt: { $gte: daysAgo(14) } }),
    HealthReport.countDocuments({ village, district, status: { $ne: 'REJECTED' }, createdAt: { $gte: daysAgo(30) } }),
    HealthReport.countDocuments({ village, district, status: { $ne: 'REJECTED' }, createdAt: { $gte: daysAgo(14), $lt: daysAgo(7) } }),
  ]);

  // Check sufficient data — fallback if not enough
  if (count7d < minReports || count30d < minHistoryDays) {
    const pred = await Prediction.create({
      village, district, state,
      currentScore: currentRiskScore,
      currentLevel: currentRiskLevel,
      predictedScore: null,
      predictedLevel: null,
      windowDays,
      confidence: null,
      insufficientData: true,
      fallbackReason: count7d < minReports
        ? `Not enough recent reports for ${village} (${count7d} in last 7 days, minimum ${minReports})`
        : `Not enough historical data for ${village} (${count30d} days of history, minimum ${minHistoryDays})`,
      modelVersion: MODEL_VERSION,
      inputsSnapshot: { count7d, count14d, count30d, countPrev7d },
      generatedAt: new Date(),
    });
    return pred;
  }

  // Statistical trend extrapolation
  // Growth rate: compare current 7d to previous 7d
  const growthRate = countPrev7d > 0
    ? ((count7d - countPrev7d) / countPrev7d) * 100
    : (count7d > 0 ? 50 : 0); // moderate signal if no baseline

  // Environmental and vulnerability modifiers
  const [envRisk, vulnScore] = await Promise.all([
    environmentalRiskService.calculateEnvironmentalRisk(village, district, 7),
    vulnerabilityService.getScoreForVillage(village, district),
  ]);

  // Water contamination trend
  const waterCount7d = await WaterReport.countDocuments({
    village, district, createdAt: { $gte: daysAgo(7) },
  });

  // Predict: apply trend to current score
  // Positive growth → score increases; environmental and water signals add to projection
  const trendMultiplier = Math.max(0.8, 1 + (growthRate / 100) * 0.4); // capped change
  const envContribution  = envRisk  * 0.15;
  const waterContribution= Math.min(20, waterCount7d * 2);

  let projectedScore = (currentRiskScore * trendMultiplier) + envContribution + waterContribution;
  // Vulnerability as modifier (+5 max for high vulnerability)
  projectedScore += (vulnScore / 100) * 5;
  projectedScore = Math.min(100, Math.max(0, Math.round(projectedScore)));

  const predictedLevel = getRiskLevel(projectedScore);
  const confidence = computeConfidence(count7d, count14d, count30d, 0);

  const inputsSnapshot = {
    count7d, count14d, count30d, countPrev7d, growthRate,
    envRisk, vulnScore, waterCount7d,
    trendMultiplier, envContribution, waterContribution,
  };

  const pred = await Prediction.create({
    village, district, state,
    currentScore: currentRiskScore,
    currentLevel: currentRiskLevel,
    predictedScore: projectedScore,
    predictedLevel: predictedLevel,
    windowDays,
    confidence,
    insufficientData: false,
    modelVersion: MODEL_VERSION,
    inputsSnapshot,
    generatedAt: new Date(),
  });

  // Generate explanation for the prediction
  const explComponents = [
    { label: 'Current risk baseline', contribution: currentRiskScore, rawValue: currentRiskScore, weight: 1 },
    { label: `7-day report growth rate (${growthRate.toFixed(0)}%)`, contribution: Math.round((trendMultiplier - 1) * currentRiskScore), rawValue: growthRate, weight: 0.4 },
    { label: 'Environmental risk (rainfall/flood)', contribution: Math.round(envContribution), rawValue: envRisk, weight: 0.15 },
    { label: 'Water contamination reports', contribution: Math.round(waterContribution), rawValue: waterCount7d, weight: 2 },
    { label: 'Community vulnerability modifier', contribution: Math.round((vulnScore / 100) * 5), rawValue: vulnScore, weight: 0.05 },
  ];
  const explanation = await explanationService.generateForPrediction(pred, explComponents);
  pred.explanationId = explanation._id;
  await pred.save();

  return pred;
};

/**
 * Get latest prediction for a location.
 */
const getLatestForLocation = async (village, district) => {
  return Prediction.findOne({ village, district }).sort({ generatedAt: -1 }).lean();
};

/**
 * Get all predictions — paginated.
 */
const getPredictions = async ({ village, district, page = 1, limit = 20 } = {}) => {
  const query = {};
  if (village)  query.village  = village;
  if (district) query.district = district;
  const skip = (page - 1) * limit;
  const [predictions, total] = await Promise.all([
    Prediction.find(query).sort({ generatedAt: -1 }).skip(skip).limit(limit).lean(),
    Prediction.countDocuments(query),
  ]);
  return { predictions, total, page, pages: Math.ceil(total / limit) };
};

/**
 * Get high-risk predicted locations (for admin overview).
 */
const getHighRiskPredictions = async () => {
  return Prediction.aggregate([
    { $match: { predictedLevel: { $in: ['HIGH', 'CRITICAL'] }, insufficientData: false } },
    { $sort: { generatedAt: -1 } },
    { $group: { _id: { village: '$village', district: '$district' }, latest: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$latest' } },
    { $sort: { predictedScore: -1 } },
  ]);
};

/**
 * Retrospective evaluation of a prediction against actual RiskAssessment outcomes (PRD §13).
 */
const evaluatePrediction = async (predictionId) => {
  const prediction = await Prediction.findById(predictionId);
  if (!prediction) throw Object.assign(new Error('Prediction not found'), { statusCode: 404 });
  if (prediction.insufficientData) return prediction;

  const RiskAssessment = require('../models/RiskAssessment');
  // Find the latest risk assessment after the prediction was generated
  const actual = await RiskAssessment.findOne({
    village: prediction.village,
    district: prediction.district,
    calculatedAt: { $gte: prediction.generatedAt },
  }).sort({ calculatedAt: -1 }).lean();

  if (actual) {
    prediction.actualOutcome = actual.riskLevel;
    prediction.evaluatedAgainstActualAt = new Date();
    await prediction.save();
  }

  return prediction;
};

/**
 * Get evaluation report comparing past predictions with actual outcomes.
 */
const getEvaluationHistory = async ({ village, district, limit = 50 } = {}) => {
  const query = { insufficientData: false, actualOutcome: { $ne: null } };
  if (village)  query.village  = village;
  if (district) query.district = district;

  const evaluated = await Prediction.find(query).sort({ evaluatedAgainstActualAt: -1 }).limit(limit).lean();
  const total = evaluated.length;
  const matched = evaluated.filter(p => p.predictedLevel === p.actualOutcome).length;
  const matchRate = total > 0 ? Math.round((matched / total) * 100) : 0;

  return {
    evaluations: evaluated,
    total,
    matched,
    matchRate,
    disclaimer: 'Retrospective accuracy signal for prototype transparency. Not a validated epidemiological claim.',
  };
};

module.exports = {
  predict,
  getLatestForLocation,
  getPredictions,
  getHighRiskPredictions,
  evaluatePrediction,
  getEvaluationHistory,
  calculatePrediction,
  calculateWeeklyTrend,
  calculateConfidence,
  computeConfidence,
};