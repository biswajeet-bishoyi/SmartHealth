const mongoose = require('mongoose');

/**
 * DataQualityAssessment
 * ---------------------
 * Computed alongside every RiskAssessment to indicate how reliable the
 * score is. Shown prominently in UI next to every risk score.
 *
 * e.g. "Signal confidence: Medium — Only 6 reports with limited history."
 */
const dataQualityAssessmentSchema = new mongoose.Schema({
  village:  { type: String, required: true, index: true },
  district: { type: String, required: true, index: true },
  state:    { type: String },

  riskAssessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'RiskAssessment', index: true },

  confidenceLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    required: true,
  },

  // Human-readable reasons for the confidence level
  reasons: [{ type: String }],

  // Raw metrics that drove the assessment
  reportCount:          { type: Number, default: 0 },
  historicalDataPoints: { type: Number, default: 0 },
  flaggedDuplicates:    { type: Number, default: 0 },
  missingLocationCount: { type: Number, default: 0 },

  generatedAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

module.exports = mongoose.model('DataQualityAssessment', dataQualityAssessmentSchema);
