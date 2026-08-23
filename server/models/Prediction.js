const mongoose = require('mongoose');

/**
 * Prediction
 * ----------
 * Stores a 3–7 day near-term risk forecast for a village/district.
 *
 * PROTOTYPE DISCLAIMER: This is an experimental/public-health forecasting model.
 * Not a medically validated diagnostic or epidemiological prediction system.
 * Confidence scores are derived from data sufficiency, not clinical validation.
 */
const predictionSchema = new mongoose.Schema({
  village:  { type: String, required: true, index: true },
  district: { type: String, required: true, index: true },
  state:    { type: String },

  // Current state at time of prediction
  currentScore: { type: Number, required: true },
  currentLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true,
  },

  // Forecast
  predictedScore: { type: Number },               // null if insufficientData
  predictedLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', null],
  },
  windowDays: { type: Number, default: 7 },        // Prediction horizon (3–7 days)

  // Confidence — derived from data sufficiency, not hard-coded
  confidence: { type: Number, min: 0, max: 100 },  // null if insufficientData

  // Fallback state
  insufficientData: { type: Boolean, default: false },
  fallbackReason: { type: String },               // Human-readable reason

  // Auditability
  modelVersion: { type: String, default: 'statistical-trend-v1', required: true },
  inputsSnapshot: { type: mongoose.Schema.Types.Mixed }, // Snapshot of inputs used

  // Linked explanation
  explanationId: { type: mongoose.Schema.Types.ObjectId, ref: 'RiskExplanation' },

  generatedAt: { type: Date, default: Date.now, index: true },

  // Retrospective accuracy evaluation (filled in later)
  actualOutcome: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', null] },
  evaluatedAgainstActualAt: { type: Date },
}, { timestamps: true });

predictionSchema.index({ village: 1, district: 1, generatedAt: -1 });

module.exports = mongoose.model('Prediction', predictionSchema);
