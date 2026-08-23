/**
 * explanationService.js
 * ----------------------
 * Generates and retrieves deterministic, explainable component breakdowns
 * for RiskAssessment and Prediction records.
 *
 * PROTOTYPE DISCLAIMER: Component contributions are derived deterministically
 * from the prototype formula. Not a clinical diagnosis.
 */

const RiskExplanation = require('../models/RiskExplanation');
const RiskAssessment = require('../models/RiskAssessment');
const Prediction = require('../models/Prediction');

const COMPONENT_LABELS = {
  symptom:       'Symptom reports (diarrhea, vomiting, dehydration, fever)',
  growth:        'Growth rate compared to baseline (recent surge)',
  water:         'Water contamination & quality reports',
  cluster:       'Geographic concentration of cases',
  environmental: 'Environmental conditions (rainfall / flood signal)',
  vulnerability: 'Community vulnerability index modifier',
};

/**
 * Generate a RiskExplanation document for a RiskAssessment.
 * Stores component contributions, weights, and raw values.
 */
const generateForAssessment = async (assessment) => {
  if (!assessment) return null;

  const weights = assessment.weightsSnapshot || { symptom: 0.40, growth: 0.25, water: 0.20, cluster: 0.15 };
  const priorityWeights = assessment.priorityWeightsSnapshot || { risk: 0.60, environmental: 0.20, vulnerability: 0.20 };

  const symptomContrib = Math.round((assessment.symptomScore || 0) * (weights.symptom || 0.40));
  const growthContrib  = Math.round((assessment.growthScore  || 0) * (weights.growth  || 0.25));
  const waterContrib   = Math.round((assessment.waterScore   || 0) * (weights.water   || 0.20));
  const clusterContrib = Math.round((assessment.clusterScore || 0) * (weights.cluster || 0.15));

  const components = [
    { label: COMPONENT_LABELS.symptom, contribution: symptomContrib, rawValue: assessment.symptomScore, weight: weights.symptom },
    { label: COMPONENT_LABELS.growth,  contribution: growthContrib,  rawValue: assessment.growthScore,  weight: weights.growth },
    { label: COMPONENT_LABELS.water,   contribution: waterContrib,   rawValue: assessment.waterScore,   weight: weights.water },
    { label: COMPONENT_LABELS.cluster, contribution: clusterContrib, rawValue: assessment.clusterScore, weight: weights.cluster },
  ];

  if (assessment.environmentalRisk > 0) {
    const envContrib = Math.round((assessment.environmentalRisk || 0) * (priorityWeights.environmental || 0.20));
    components.push({ label: COMPONENT_LABELS.environmental, contribution: envContrib, rawValue: assessment.environmentalRisk, weight: priorityWeights.environmental });
  }

  if (assessment.vulnerabilityScore > 0) {
    const vulnContrib = Math.round((assessment.vulnerabilityScore || 0) * (priorityWeights.vulnerability || 0.20));
    components.push({ label: COMPONENT_LABELS.vulnerability, contribution: vulnContrib, rawValue: assessment.vulnerabilityScore, weight: priorityWeights.vulnerability });
  }

  const explanation = await RiskExplanation.create({
    riskAssessmentId: assessment._id,
    village:          assessment.village,
    district:         assessment.district,
    state:            assessment.state,
    totalScore:       assessment.riskScore,
    level:            assessment.riskLevel,
    components,
    modelVersion:     assessment.modelVersion || 'risk-engine-v1',
    generatedAt:      new Date(),
    disclaimer:       'Score contributions are derived deterministically from the public-health monitoring formula. Not a clinical diagnosis.',
  });

  return explanation;
};

/**
 * Generate a RiskExplanation document for a Prediction.
 */
const generateForPrediction = async (prediction, components = []) => {
  if (!prediction) return null;

  const explanation = await RiskExplanation.create({
    predictionId:     prediction._id,
    village:          prediction.village,
    district:         prediction.district,
    state:            prediction.state,
    totalScore:       prediction.predictedScore || prediction.currentScore,
    level:            prediction.predictedLevel || prediction.currentLevel,
    components,
    modelVersion:     prediction.modelVersion || 'statistical-trend-v1',
    generatedAt:      new Date(),
    disclaimer:       'Prediction explanation reflects statistical trend extrapolation and data sufficiency. Not a clinical prediction.',
  });

  return explanation;
};

/**
 * Get explanation by RiskAssessment ID.
 */
const getByAssessmentId = async (assessmentId) => {
  return RiskExplanation.findOne({ riskAssessmentId: assessmentId }).sort({ generatedAt: -1 }).lean();
};

/**
 * Get explanation by Prediction ID.
 */
const getByPredictionId = async (predictionId) => {
  return RiskExplanation.findOne({ predictionId }).sort({ generatedAt: -1 }).lean();
};

module.exports = {
  generateForAssessment,
  generateForPrediction,
  getByAssessmentId,
  getByPredictionId,
};