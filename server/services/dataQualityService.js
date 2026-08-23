/**
 * dataQualityService.js
 * ---------------------
 * Computes a DataQualityAssessment alongside every risk calculation.
 * Shows signal confidence in the UI: "Signal confidence: Medium — 6 reports, limited history."
 */

const DataQualityAssessment = require('../models/DataQualityAssessment');
const HealthReport = require('../models/HealthReport');

const assess = async ({ village, district, riskAssessmentId, reportCount, timeWindowDays = 7 }) => {
  const reasons = [];
  let confidencePoints = 100; // Start high, deduct for issues

  // Insufficient reports
  if (reportCount < 5) {
    reasons.push(`Only ${reportCount} report(s) available — limited data for this location`);
    confidencePoints -= 40;
  } else if (reportCount < 10) {
    reasons.push(`${reportCount} reports available — moderate data sufficiency`);
    confidencePoints -= 15;
  }

  // Historical data depth
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const historicalDataPoints = await HealthReport.countDocuments({
    village, district,
    createdAt: { $gte: thirtyDaysAgo },
    status: { $ne: 'REJECTED' },
  });

  if (historicalDataPoints < 10) {
    reasons.push('Limited historical baseline (< 30 days) for this village');
    confidencePoints -= 25;
  }

  // Check for possible duplicate-style submissions (same user, same day)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentByUser = await HealthReport.aggregate([
    { $match: { village, district, createdAt: { $gte: oneDayAgo }, status: { $ne: 'REJECTED' } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } },
    { $match: { count: { $gt: 3 } } },
  ]);
  const flaggedDuplicates = recentByUser.length;
  if (flaggedDuplicates > 0) {
    reasons.push(`${flaggedDuplicates} user(s) submitted multiple reports in 24h — possible duplicate`);
    confidencePoints -= 20;
  }

  confidencePoints = Math.max(0, Math.min(100, confidencePoints));

  let confidenceLevel;
  if (confidencePoints >= 70) confidenceLevel = 'HIGH';
  else if (confidencePoints >= 40) confidenceLevel = 'MEDIUM';
  else confidenceLevel = 'LOW';

  if (reasons.length === 0) {
    reasons.push('Sufficient data available for this assessment');
  }

  const assessment = await DataQualityAssessment.create({
    village, district,
    riskAssessmentId,
    confidenceLevel,
    reasons,
    reportCount,
    historicalDataPoints,
    flaggedDuplicates,
    generatedAt: new Date(),
  });

  return assessment;
};

module.exports = { assess };
