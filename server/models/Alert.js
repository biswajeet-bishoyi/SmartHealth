const mongoose = require('mongoose');

const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES = ['PENDING_REVIEW', 'VERIFIED', 'APPROVED', 'BROADCAST', 'REJECTED', 'EXPIRED'];
const TARGET_AUDIENCES = ['COMMUNITY', 'HEALTH_WORKER', 'REGIONAL', 'NATIONAL'];

/**
 * Alert status lifecycle (enforced server-side):
 * PENDING_REVIEW → VERIFIED (health worker) → APPROVED → BROADCAST (admin only)
 *                                            ↓
 *                               REJECTED / EXPIRED (any review stage)
 *
 * Only a National Admin can move an alert to BROADCAST.
 */
const alertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Alert title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Alert message is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    riskLevel: {
      type: String,
      enum: { values: RISK_LEVELS, message: 'Invalid risk level' },
      required: true,
    },
    // Location
    state: { type: String, trim: true },
    district: { type: String, trim: true },
    village: { type: String, trim: true },

    targetAudience: {
      type: String,
      enum: { values: TARGET_AUDIENCES, message: 'Invalid target audience' },
      default: 'COMMUNITY',
    },
    // Workflow
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: 'Invalid status' },
      default: 'PENDING_REVIEW',
    },
    // Related risk assessment (for traceability)
    riskAssessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RiskAssessment',
    },
    // Timestamps for each transition
    verifiedAt: { type: Date },
    approvedAt: { type: Date },
    broadcastAt: { type: Date },
    expiresAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: [500] },
    // Prevention actions to show community
    preventionActions: [{ type: String, trim: true }],
    // v2.0: geo-targeting
    geoRadius: { type: Number },  // optional radius in km
    // v2.0: language of alert content
    language: { type: String, enum: ['en', 'hi', 'as', 'bn'], default: 'en' },
    // v2.0: acknowledgement tracking (where appropriate for the audience)
    acknowledgedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
  }
);

alertSchema.index({ status: 1 });
alertSchema.index({ district: 1, status: 1 });
alertSchema.index({ riskLevel: 1 });
alertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
