const mongoose = require('mongoose');

/**
 * AuditLog
 * --------
 * Append-only record of every sensitive action in the system.
 * Never edited or deleted through normal application code paths.
 *
 * Tracked actions: verify, reject, approve, broadcast, assign resource,
 * change configuration, alert state transitions.
 */
const auditLogSchema = new mongoose.Schema({
  actorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  actorName: { type: String },
  actorRole: {
    type: String,
    enum: ['COMMUNITY_MEMBER', 'HEALTH_WORKER', 'NATIONAL_ADMIN', 'SYSTEM'],
    index: true,
  },

  action: {
    type: String,
    required: true,
    index: true,
    // e.g. REPORT_VERIFIED, REPORT_REJECTED, ALERT_APPROVED, ALERT_BROADCAST,
    //      ALERT_REJECTED, RESOURCE_ASSIGNED, CONFIG_UPDATED, WATER_SOURCE_INSPECTED
  },

  entityType: { type: String, required: true, index: true }, // e.g. 'HealthReport', 'Alert'
  entityId:   { type: mongoose.Schema.Types.ObjectId, index: true },

  previousValue: { type: mongoose.Schema.Types.Mixed }, // Before-state snapshot
  newValue:      { type: mongoose.Schema.Types.Mixed }, // After-state snapshot

  metadata: { type: mongoose.Schema.Types.Mixed },      // Extra context

  village:  { type: String, index: true },
  district: { type: String, index: true },

  occurredAt: { type: Date, default: Date.now, index: true },
}, {
  timestamps: false, // occurredAt is the immutable timestamp
});

// Prevent updates/deletes at the application layer via middleware
// (enforcement is architectural — see auditService.js comments)
auditLogSchema.index({ actorId: 1, occurredAt: -1 });
auditLogSchema.index({ action: 1, occurredAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
