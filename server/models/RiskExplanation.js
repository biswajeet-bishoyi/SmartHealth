// server/models/RiskExplanation.js
/**
 * RiskExplanation schema
 *
 * Stores deterministic breakdown of risk/prediction scores into component
 * contributions. Used for auditability and transparency.
 *
 * All values are calculated from the underlying RiskAssessment or Prediction
 * record and are never user-modifiable.
 */

const mongoose = require('mongoose');

const RiskExplanationSchema = new mongoose.Schema({
  riskAssessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'RiskAssessment' },
  predictionId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Prediction' },

  village:           String,
  district:          String,
  state:             String,

  totalScore:        Number,
  level:             String,          // LOW, MEDIUM, HIGH, CRITICAL
  modelVersion:      String,
  generatedAt:       { type: Date, default: Date.now },

  components: [{
    label:           String,      // e.g., "Symptom reports..."
    contribution:    Number,      // signed contribution to total score
    rawValue:        Number,      // the underlying metric value
    weight:          Number       // weight used in calculation
  }],

  // Disclaimer text for UI display (same across all docs)
  disclaimer:        String
});

// Index for fast lookup
RiskExplanationSchema.index({ riskAssessmentId: 1 });
RiskExplanationSchema.index({ predictionId: 1 });

module.exports = mongoose.model('RiskExplanation', RiskExplanationSchema);