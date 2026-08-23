/**
 * waterSourceService.js
 * ---------------------
 * Manages persistent WaterSource entities.
 * Links incoming WaterReports to WaterSource records.
 * Recomputes source-level risk whenever a new linked report arrives.
 */

const WaterSource = require('../models/WaterSource');
const WaterReport = require('../models/WaterReport');

const SEVERITY_WEIGHT   = { LOW: 1, MEDIUM: 1.5, HIGH: 2, CRITICAL: 3 };
const ISSUE_WEIGHT = {
  dirty_water: 2, suspected_contamination: 3, flood_contamination: 3,
  bad_smell: 1.5, broken_water_source: 1, other: 1,
};
const normalize = (v, max) => Math.min(100, Math.max(0, (v / max) * 100));
const getRiskLevel = (score) => {
  if (score <= 30) return 'LOW';
  if (score <= 60) return 'MEDIUM';
  if (score <= 80) return 'HIGH';
  return 'CRITICAL';
};

/**
 * Recompute risk for a water source and save it.
 */
const recomputeSourceRisk = async (source) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const reports = await WaterReport.find({
    village: source.village,
    district: source.district,
    waterSource: source.type,
    createdAt: { $gte: sevenDaysAgo },
  }).lean();

  let totalScore = 0;
  let contaminationCount = 0;
  for (const r of reports) {
    const sev   = SEVERITY_WEIGHT[r.severity] || 1;
    const issue = ISSUE_WEIGHT[r.issueType] || 1;
    totalScore += sev * issue;
    if (['suspected_contamination', 'flood_contamination', 'dirty_water'].includes(r.issueType)) {
      contaminationCount++;
    }
  }

  const maxScore = 10 * SEVERITY_WEIGHT.CRITICAL * ISSUE_WEIGHT.suspected_contamination;
  const riskScore = Math.round(normalize(totalScore, maxScore));
  const riskLevel = getRiskLevel(riskScore);

  // Update status if risk is high
  let newStatus = source.status;
  if (riskScore >= 61 && source.status === 'ACTIVE') newStatus = 'INVESTIGATION_REQUIRED';

  // Snapshot for history
  source.historicalRiskSnapshots = source.historicalRiskSnapshots || [];
  source.historicalRiskSnapshots.push({ riskScore, riskLevel, snappedAt: new Date(), reportCount: reports.length });
  // Keep only last 30 snapshots
  if (source.historicalRiskSnapshots.length > 30) source.historicalRiskSnapshots.shift();

  source.currentRiskScore          = riskScore;
  source.currentRiskLevel          = riskLevel;
  source.status                    = newStatus;
  source.totalReportCount          = reports.length;
  source.contaminationReportCount  = contaminationCount;
  await source.save();
  return source;
};

/**
 * Find or create a WaterSource entity for a location + type combination.
 */
const findOrCreate = async ({ village, district, state, waterSourceType, name }) => {
  let source = await WaterSource.findOne({ village, district, type: waterSourceType });
  if (!source) {
    source = await WaterSource.create({
      name: name || `${waterSourceType.replace('_', ' ')} in ${village}`,
      type: waterSourceType,
      village, district, state,
    });
  }
  return source;
};

/**
 * Called after a new WaterReport is saved. Links it to a source and recomputes risk.
 */
const onNewWaterReport = async (waterReport) => {
  if (!waterReport.waterSource) return;
  try {
    const source = await findOrCreate({
      village: waterReport.village,
      district: waterReport.district,
      state: waterReport.state,
      waterSourceType: waterReport.waterSource,
    });
    await recomputeSourceRisk(source);
  } catch (err) {
    console.error('[waterSourceService] Error on new water report:', err.message);
  }
};

/**
 * Get all water sources ordered by risk — for the risk hotspot list and map layer.
 */
const getRiskHotspots = async (filter = {}) => {
  const query = {};
  if (filter.district) query.district = filter.district;
  if (filter.state)    query.state    = filter.state;
  if (filter.status)   query.status   = filter.status;
  return WaterSource.find(query).sort({ currentRiskScore: -1 }).lean();
};

/**
 * Log an inspection result (Health Worker action).
 */
const logInspection = async (sourceId, { result, status, inspectedBy }) => {
  const source = await WaterSource.findById(sourceId);
  if (!source) throw Object.assign(new Error('Water source not found'), { statusCode: 404 });
  source.lastInspectionAt     = new Date();
  source.lastInspectionResult = result;
  source.lastInspectedBy      = inspectedBy;
  if (status) source.status   = status;
  await source.save();
  return source;
};

module.exports = { findOrCreate, onNewWaterReport, getRiskHotspots, logInspection, recomputeSourceRisk };
