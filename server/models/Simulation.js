const mongoose = require('mongoose');

/**
 * Simulation
 * ----------
 * Stores the inputs and results of what-if simulator runs.
 * NEVER writes to production RiskAssessment or any other production collection.
 * Results are always labeled "SIMULATION — not a stored assessment".
 */
const simulationSchema = new mongoose.Schema({
  village:  { type: String, required: true },
  district: { type: String, required: true },
  state:    { type: String },

  runBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  runAt:   { type: Date, default: Date.now },

  // Input modifications applied
  inputs: {
    additionalDiarrheaReports:  { type: Number, default: 0 },
    additionalVomitingReports:  { type: Number, default: 0 },
    waterContaminationConfirmed:{ type: Boolean, default: false },
    rainfallSpike:              { type: Boolean, default: false },
    additionalFeverReports:     { type: Number, default: 0 },
    additionalAffectedPeople:   { type: Number, default: 0 },
    customNote:                 { type: String },
  },

  // Snapshot used as baseline
  baselineRiskScore: { type: Number, required: true },
  baselineRiskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },

  // Projected result
  projectedRiskScore: { type: Number, required: true },
  projectedRiskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
  scoreDelta:         { type: Number },

  // Explanation of what changed
  explanation: [{
    label:        { type: String },
    contribution: { type: Number },
    baselineValue:{ type: Number },
    simulatedValue:{ type: Number },
  }],

  // Always labeled — never stored as a real assessment
  label: { type: String, default: 'SIMULATION — not a stored assessment' },

}, { timestamps: true });

simulationSchema.index({ village: 1, district: 1, runAt: -1 });
simulationSchema.index({ runBy: 1, runAt: -1 });

module.exports = mongoose.model('Simulation', simulationSchema);
