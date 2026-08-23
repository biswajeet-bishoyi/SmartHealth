/**
 * simulationService.js
 * --------------------
 * What-if sandbox for administrators.
 *
 * HARD RULES (enforced here and tested):
 * 1. NEVER writes to production RiskAssessment, HealthReport, or any other production collection.
 * 2. Every result is stored as a Simulation document (separate collection).
 * 3. Every result is labeled "SIMULATION — not a stored assessment".
 * 4. Uses the EXACT same risk engine logic as production (same code path, injected snapshot).
 */

const Simulation = require('../models/Simulation');

/**
 * Inline risk computation logic (mirrors riskEngine.js but NEVER touches DB production collections).
 * Uses an in-memory snapshot of inputs instead of reading from DB.
 */
const computeRiskFromSnapshot = (snapshot, config) => {
  const {
    symptomScore = 0,
    growthScore  = 0,
    waterScore   = 0,
    clusterScore = 0,
  } = snapshot;

  const weights = config?.weights || { symptom: 0.40, growth: 0.25, water: 0.20, cluster: 0.15 };
  const normalize = (v, max) => Math.min(100, Math.max(0, (v / max) * 100));
  const getRiskLevel = (score) => {
    if (score <= 30) return 'LOW';
    if (score <= 60) return 'MEDIUM';
    if (score <= 80) return 'HIGH';
    return 'CRITICAL';
  };

  const riskScore = Math.round(
    symptomScore * weights.symptom +
    growthScore  * weights.growth  +
    waterScore   * weights.water   +
    clusterScore * weights.cluster
  );
  return { riskScore, riskLevel: getRiskLevel(riskScore) };
};

/**
 * Run a what-if simulation.
 * @param {Object} params
 * @param {string} params.village
 * @param {string} params.district
 * @param {string} params.state
 * @param {Object} params.baselineAssessment - Current RiskAssessment (from DB read, not modified)
 * @param {Object} params.inputs - Hypothetical modifications
 * @param {string} params.runBy - Admin user ID
 * @returns {Simulation} saved simulation result
 */
const runSimulation = async ({ village, district, state, baselineAssessment, inputs, runBy }) => {
  const {
    additionalDiarrheaReports  = 0,
    additionalVomitingReports  = 0,
    waterContaminationConfirmed= false,
    rainfallSpike              = false,
    additionalFeverReports     = 0,
    additionalAffectedPeople   = 0,
    customNote                 = '',
  } = inputs;

  const SYMPTOM_WEIGHTS = { diarrhea: 3.0, vomiting: 2.5, fever: 1.5 };
  const MAX_SYMPTOM_WEIGHT = 20 * 3.0; // same as riskEngine config

  // Build simulated snapshot — clone baseline, apply modifications
  let simSymptomScore = baselineAssessment.symptomScore;
  const additionalSymptomWeight =
    (additionalDiarrheaReports * SYMPTOM_WEIGHTS.diarrhea +
     additionalVomitingReports * SYMPTOM_WEIGHTS.vomiting +
     additionalFeverReports    * SYMPTOM_WEIGHTS.fever) *
    Math.max(1, additionalAffectedPeople || 1);
  simSymptomScore = Math.min(100, simSymptomScore + (additionalSymptomWeight / MAX_SYMPTOM_WEIGHT) * 100);

  let simWaterScore = baselineAssessment.waterScore;
  if (waterContaminationConfirmed) {
    simWaterScore = Math.min(100, simWaterScore + 30); // contamination confirmed → spike
  }

  let simGrowthScore = baselineAssessment.growthScore;
  const totalAdditional = additionalDiarrheaReports + additionalVomitingReports + additionalFeverReports;
  if (totalAdditional > 0) {
    simGrowthScore = Math.min(100, simGrowthScore + Math.min(40, totalAdditional * 4));
  }

  let simClusterScore = baselineAssessment.clusterScore;
  if (totalAdditional > 0) {
    simClusterScore = Math.min(100, simClusterScore + Math.min(20, totalAdditional * 2));
  }

  const simulatedSnapshot = {
    symptomScore: Math.round(simSymptomScore),
    growthScore:  Math.round(simGrowthScore),
    waterScore:   Math.round(simWaterScore),
    clusterScore: Math.round(simClusterScore),
  };

  const config = {
    weights: baselineAssessment.weightsSnapshot || { symptom: 0.40, growth: 0.25, water: 0.20, cluster: 0.15 },
  };

  const { riskScore: projectedRiskScore, riskLevel: projectedRiskLevel } = computeRiskFromSnapshot(simulatedSnapshot, config);

  // Explanation of what changed
  const explanation = [
    { label: 'Symptom score', contribution: Math.round(simSymptomScore - baselineAssessment.symptomScore), baselineValue: baselineAssessment.symptomScore, simulatedValue: Math.round(simSymptomScore) },
    { label: 'Water score', contribution: Math.round(simWaterScore - baselineAssessment.waterScore), baselineValue: baselineAssessment.waterScore, simulatedValue: Math.round(simWaterScore) },
    { label: 'Growth score', contribution: Math.round(simGrowthScore - baselineAssessment.growthScore), baselineValue: baselineAssessment.growthScore, simulatedValue: Math.round(simGrowthScore) },
    { label: 'Cluster score', contribution: Math.round(simClusterScore - baselineAssessment.clusterScore), baselineValue: baselineAssessment.clusterScore, simulatedValue: Math.round(simClusterScore) },
  ].filter(e => e.contribution !== 0);

  // NEVER writes to production RiskAssessment — stores in Simulation collection only
  const simulation = await Simulation.create({
    village, district, state,
    runBy,
    runAt: new Date(),
    inputs,
    baselineRiskScore: baselineAssessment.riskScore,
    baselineRiskLevel: baselineAssessment.riskLevel,
    projectedRiskScore,
    projectedRiskLevel,
    scoreDelta: projectedRiskScore - baselineAssessment.riskScore,
    explanation,
    label: 'SIMULATION — not a stored assessment',
  });

  return simulation;
};

const getSimulations = async ({ village, district, runBy, page = 1, limit = 20 } = {}) => {
  const query = {};
  if (village)  query.village  = village;
  if (district) query.district = district;
  if (runBy)    query.runBy    = runBy;
  const skip = (page - 1) * limit;
  const [simulations, total] = await Promise.all([
    Simulation.find(query).populate('runBy', 'name').sort({ runAt: -1 }).skip(skip).limit(limit).lean(),
    Simulation.countDocuments(query),
  ]);
  return { simulations, total };
};

module.exports = { runSimulation, getSimulations };
