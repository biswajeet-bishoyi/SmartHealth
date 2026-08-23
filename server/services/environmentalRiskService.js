/**
 * environmentalRiskService.js
 * ---------------------------
 * Converts EnvironmentalObservation records to a 0–100 environmental risk score
 * per location and time window. Feeds both the risk engine and prediction engine.
 *
 * PROTOTYPE DISCLAIMER: In this prototype, environmental data comes from mock/seed
 * records. Real integration (e.g., IMD weather API) is a Phase 2 dependency.
 * This is clearly labeled as prototype/simulated data in the UI.
 */

const EnvironmentalObservation = require('../models/EnvironmentalObservation');

// Severity multiplier map
const SEVERITY_MULTIPLIER = { LOW: 1, MEDIUM: 1.5, HIGH: 2.5, CRITICAL: 4 };
// Type weight map — flood events carry more weight than light rainfall
const TYPE_WEIGHT = { RAINFALL: 1, FLOOD: 3, CONTAMINATION_RISK: 2 };
// Heavy rainfall event bonus
const HEAVY_RAINFALL_BONUS = 1.5;

/**
 * Calculate environmental risk score (0–100) for a village/district.
 * @param {string} village
 * @param {string} district
 * @param {number} windowDays - Look-back window in days (default 7)
 * @returns {number} score 0–100
 */
const calculateEnvironmentalRisk = async (village, district, windowDays = 7) => {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const observations = await EnvironmentalObservation.find({
    village,
    district,
    observedAt: { $gte: since },
  }).lean();

  if (observations.length === 0) return 0;

  let totalScore = 0;
  for (const obs of observations) {
    const sev = SEVERITY_MULTIPLIER[obs.severity] || 1;
    const typeW = TYPE_WEIGHT[obs.observationType] || 1;
    let bonus = 1;
    if (obs.isHeavyRainfall) bonus = HEAVY_RAINFALL_BONUS;
    if (obs.isFloodEvent)    bonus = Math.max(bonus, 2);
    totalScore += sev * typeW * bonus;
  }

  // Normalize: 5 HIGH-severity FLOOD events ≈ score of 100
  const maxScore = 5 * SEVERITY_MULTIPLIER.HIGH * TYPE_WEIGHT.FLOOD * 1;
  const score = Math.min(100, Math.max(0, (totalScore / maxScore) * 100));
  return Math.round(score);
};

/**
 * Get all environmental observations for a location.
 */
const getObservationsForLocation = async (village, district, windowDays = 30) => {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  return EnvironmentalObservation.find({ village, district, observedAt: { $gte: since } })
    .sort({ observedAt: -1 })
    .lean();
};

/**
 * Create an environmental observation (manual entry by admin).
 */
const createObservation = async (data) => {
  const obs = await EnvironmentalObservation.create({
    ...data,
    source: data.source || 'MANUAL_ENTRY',
    isMock: false,
  });
  return obs;
};

module.exports = {
  calculateEnvironmentalRisk,
  getObservationsForLocation,
  createObservation,
};
