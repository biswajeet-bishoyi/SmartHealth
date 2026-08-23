const mongoose = require('mongoose');

/**
 * ResponsePlan
 * ------------
 * Recommended public-health operational actions for HIGH/CRITICAL locations.
 * Generated automatically by responseRecommendationService.
 * Health Worker can edit/approve before actioning.
 *
 * DISCLAIMER: Recommendations are operational public-health actions only.
 * Never personalized medical advice or treatment recommendations.
 */
const actionSchema = new mongoose.Schema({
  templateRef:         { type: String },    // Template key from action library
  description:         { type: String, required: true },
  priority:            { type: Number, default: 1 },
  resourceRequirement: { type: String },    // e.g. "2 health workers"
  assignmentStatus: {
    type: String,
    enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'],
    default: 'PENDING',
  },
  notes: { type: String },
}, { _id: false });

const responsePlanSchema = new mongoose.Schema({
  village:  { type: String, required: true, index: true },
  district: { type: String, required: true, index: true },
  state:    { type: String },

  riskAssessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'RiskAssessment', index: true },
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true,
  },

  actions: [actionSchema],

  status: {
    type: String,
    enum: ['DRAFT', 'REVIEWED', 'IN_PROGRESS', 'COMPLETED'],
    default: 'DRAFT',
    index: true,
  },

  // Who created / reviewed
  createdBySystem: { type: Boolean, default: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },

  notes: { type: String },
}, { timestamps: true });

responsePlanSchema.index({ village: 1, district: 1, status: 1 });

module.exports = mongoose.model('ResponsePlan', responsePlanSchema);
