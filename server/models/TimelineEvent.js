const mongoose = require('mongoose');

/**
 * TimelineEvent
 * -------------
 * Chronological record of events for an outbreak/location.
 * Populated automatically as a side effect of existing write paths —
 * never hand-authored separately (avoids drift).
 */
const timelineEventSchema = new mongoose.Schema({
  village:  { type: String, required: true, index: true },
  district: { type: String, required: true, index: true },
  state:    { type: String },

  eventType: {
    type: String,
    enum: [
      'REPORT',
      'WATER_REPORT',
      'WATER_EVENT',
      'ENVIRONMENTAL_EVENT',
      'RISK_CHANGE',
      'PREDICTION',
      'VERIFICATION',
      'ALERT_CREATED',
      'ALERT_VERIFIED',
      'ALERT_APPROVED',
      'ALERT_BROADCAST',
      'ALERT_REJECTED',
      'RESPONSE_ACTION',
      'RESOURCE_ASSIGNED',
      'WATER_SOURCE_INSPECTED',
    ],
    required: true,
    index: true,
  },

  // Short plain-language summary for the timeline UI
  summary: { type: String, required: true },

  // Optional links to related entities
  relatedEntityId:   { type: mongoose.Schema.Types.ObjectId },
  relatedEntityType: { type: String }, // 'HealthReport', 'Alert', 'RiskAssessment', etc.

  // Risk level at the time of this event (for color coding)
  riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', null] },

  // Actor who triggered this event (if applicable)
  actorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorRole: { type: String },

  occurredAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

timelineEventSchema.index({ village: 1, district: 1, occurredAt: 1 });

module.exports = mongoose.model('TimelineEvent', timelineEventSchema);
