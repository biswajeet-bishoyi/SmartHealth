const mongoose = require('mongoose');

/**
 * RiskConfig
 * ----------
 * Singleton document (only one should exist). Holds all configurable
 * weights and thresholds for the risk engine.
 * Editable only by NATIONAL_ADMIN. Every change is audited.
 *
 * PROTOTYPE DISCLAIMER: All default weights are prototype parameters,
 * not medically validated values. Labeled as such in the UI.
 */
const riskConfigSchema = new mongoose.Schema({
  // Singleton marker
  _singleton: { type: String, default: 'risk_config', unique: true },

  // Composite score weights (must conceptually sum to 1.0 for currentRiskScore)
  weights: {
    symptom: { type: Number, default: 0.40 },
    growth:  { type: Number, default: 0.25 },
    water:   { type: Number, default: 0.20 },
    cluster: { type: Number, default: 0.15 },
  },

  // Priority score weights (for layered decision support)
  priorityWeights: {
    risk:          { type: Number, default: 0.60 },
    environmental: { type: Number, default: 0.20 },
    vulnerability: { type: Number, default: 0.20 },
  },

  // Risk level thresholds (upper bound per level)
  thresholds: {
    LOW:      { type: Number, default: 30 },
    MEDIUM:   { type: Number, default: 60 },
    HIGH:     { type: Number, default: 80 },
    CRITICAL: { type: Number, default: 100 },
  },

  // Symptom weights (prototype — not clinically validated)
  symptomWeights: {
    diarrhea:       { type: Number, default: 3.0 },
    vomiting:       { type: Number, default: 2.5 },
    dehydration:    { type: Number, default: 3.0 },
    fever:          { type: Number, default: 1.5 },
    abdominal_pain: { type: Number, default: 1.5 },
    other:          { type: Number, default: 1.0 },
  },

  // Time windows
  timeWindowDays:      { type: Number, default: 7 },
  clusterWindowHours:  { type: Number, default: 48 },
  clusterThreshold:    { type: Number, default: 5 },

  // Normalization baselines
  maxReportsForSymptom: { type: Number, default: 20 },
  maxWaterReports:      { type: Number, default: 10 },
  maxGrowthRate:        { type: Number, default: 200 },

  // Minimum data for prediction (else insufficientData = true)
  minReportsForPrediction:   { type: Number, default: 5 },
  minHistoryDaysForPrediction:{ type: Number, default: 7 },

  // Audit trail
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  version:   { type: Number, default: 1 },

  // Model version string written to every RiskAssessment
  modelVersion: { type: String, default: 'risk-engine-v1' },
}, { timestamps: true });

module.exports = mongoose.model('RiskConfig', riskConfigSchema);
