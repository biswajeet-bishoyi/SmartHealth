/**
 * auditService.js
 * ---------------
 * Append-only audit log for all sensitive system actions.
 * Called from every sensitive service — never edited/deleted via normal code paths.
 *
 * Usage:
 *   await auditService.record({
 *     actorId, actorRole, action, entityType, entityId,
 *     previousValue, newValue, metadata, village, district
 *   });
 */

const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

/**
 * Record an audit event. Never throws — if audit write fails, logs to console
 * but does not interrupt the main flow (audit failure is its own alert, not a blocker).
 */
const record = async ({
  actorId,
  actorRole = 'SYSTEM',
  action,
  entityType,
  entityId,
  previousValue,
  newValue,
  metadata,
  village,
  district,
}) => {
  try {
    let actorName;
    if (actorId) {
      try {
        const user = await User.findById(actorId).select('name').lean();
        actorName = user?.name;
      } catch (_) { /* ignore — name is supplementary */ }
    }

    await AuditLog.create({
      actorId,
      actorName,
      actorRole,
      action,
      entityType,
      entityId,
      previousValue,
      newValue,
      metadata,
      village,
      district,
      occurredAt: new Date(),
    });
  } catch (err) {
    // Audit failures are logged but never propagated — they should never break the main flow
    console.error('[auditService] Failed to write audit log:', err.message);
  }
};

/**
 * Get paginated audit logs — admin only.
 * Filterable by actorId, action, entityType, village, district, date range.
 */
const getAuditLogs = async ({ actorId, action, entityType, village, district, startDate, endDate, page = 1, limit = 50 } = {}) => {
  const query = {};
  if (actorId)    query.actorId = actorId;
  if (action)     query.action = action;
  if (entityType) query.entityType = entityType;
  if (village)    query.village = village;
  if (district)   query.district = district;
  if (startDate || endDate) {
    query.occurredAt = {};
    if (startDate) query.occurredAt.$gte = new Date(startDate);
    if (endDate)   query.occurredAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ occurredAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(query),
  ]);

  return { logs, total, page, pages: Math.ceil(total / limit) };
};

module.exports = { record, getAuditLogs };
