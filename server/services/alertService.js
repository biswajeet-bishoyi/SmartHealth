const Alert = require('../models/Alert');
const auditService  = require('./auditService');
const timelineService = require('./timelineService');

/**
 * Alert Service — manages the alert lifecycle.
 *
 * Status state machine (server-enforced):
 *   PENDING_REVIEW → VERIFIED (health worker)
 *                 → APPROVED  (admin)
 *                 → BROADCAST (admin only)
 *                 → REJECTED  (any reviewer)
 *                 → EXPIRED   (admin)
 *
 * Only NATIONAL_ADMIN can move to BROADCAST.
 * High/Critical risk auto-creates a PENDING_REVIEW alert — NEVER auto-broadcasts.
 *
 * Every transition writes an AuditLog entry and a TimelineEvent.
 */

const createPotentialAlert = async ({ riskAssessment, createdByUserId }) => {
  const { village, district, state, riskLevel, riskScore } = riskAssessment;

  const existing = await Alert.findOne({
    village, district,
    status: { $in: ['PENDING_REVIEW', 'VERIFIED', 'APPROVED'] },
  });
  if (existing) return existing;

  const preventionActions = getPreventionActions(riskLevel);

  const alert = await Alert.create({
    title: `${riskLevel} Risk Detected in ${village}, ${district}`,
    message: `An increased number of water-related health observation reports have been detected in ${village}, ${district}. Risk score: ${riskScore}/100. This is a public-health monitoring signal — not a medical diagnosis. Please review.`,
    riskLevel,
    state,
    district,
    village,
    targetAudience: 'COMMUNITY',
    createdBy: createdByUserId,
    status: 'PENDING_REVIEW',
    riskAssessmentId: riskAssessment._id,
    preventionActions,
  });

  await Promise.all([
    auditService.record({
      actorId: createdByUserId,
      actorRole: 'SYSTEM',
      action: 'ALERT_CREATED',
      entityType: 'Alert',
      entityId: alert._id,
      newValue: { status: 'PENDING_REVIEW', riskLevel, riskScore },
      village, district,
    }),
    timelineService.createEvent({
      village, district, state,
      eventType: 'ALERT_CREATED',
      summary: `Potential alert created: ${riskLevel} risk (score ${riskScore}/100) — awaiting Health Worker review`,
      relatedEntityId: alert._id,
      relatedEntityType: 'Alert',
      riskLevel,
    }),
  ]);

  return alert;
};

const verifyAlert = async (alertId, workerId) => {
  const alert = await Alert.findById(alertId);
  if (!alert) throw Object.assign(new Error('Alert not found'), { statusCode: 404 });

  if (alert.status !== 'PENDING_REVIEW') {
    throw Object.assign(new Error(`Cannot verify an alert with status: ${alert.status}`), { statusCode: 400 });
  }

  const prev = { status: alert.status };
  alert.status = 'VERIFIED';
  alert.verifiedBy = workerId;
  alert.verifiedAt = new Date();
  await alert.save();

  await Promise.all([
    auditService.record({
      actorId: workerId, actorRole: 'HEALTH_WORKER',
      action: 'ALERT_VERIFIED',
      entityType: 'Alert', entityId: alert._id,
      previousValue: prev, newValue: { status: 'VERIFIED' },
      village: alert.village, district: alert.district,
    }),
    timelineService.createEvent({
      village: alert.village, district: alert.district, state: alert.state,
      eventType: 'ALERT_VERIFIED',
      summary: 'Alert verified by Health Worker — escalated for Admin approval',
      relatedEntityId: alert._id, relatedEntityType: 'Alert',
      riskLevel: alert.riskLevel, actorId: workerId, actorRole: 'HEALTH_WORKER',
    }),
  ]);

  return alert;
};

const approveAlert = async (alertId, adminId) => {
  const alert = await Alert.findById(alertId);
  if (!alert) throw Object.assign(new Error('Alert not found'), { statusCode: 404 });

  if (alert.status !== 'VERIFIED' && alert.status !== 'PENDING_REVIEW') {
    throw Object.assign(new Error(`Cannot approve an alert with status: ${alert.status}`), { statusCode: 400 });
  }

  const prev = { status: alert.status };
  alert.status = 'APPROVED';
  alert.approvedBy = adminId;
  alert.approvedAt = new Date();
  await alert.save();

  await Promise.all([
    auditService.record({
      actorId: adminId, actorRole: 'NATIONAL_ADMIN',
      action: 'ALERT_APPROVED',
      entityType: 'Alert', entityId: alert._id,
      previousValue: prev, newValue: { status: 'APPROVED' },
      village: alert.village, district: alert.district,
    }),
    timelineService.createEvent({
      village: alert.village, district: alert.district, state: alert.state,
      eventType: 'ALERT_APPROVED',
      summary: 'Alert approved by National Admin — ready for broadcast',
      relatedEntityId: alert._id, relatedEntityType: 'Alert',
      riskLevel: alert.riskLevel, actorId: adminId, actorRole: 'NATIONAL_ADMIN',
    }),
  ]);

  return alert;
};

const broadcastAlert = async (alertId, adminId, io) => {
  const alert = await Alert.findById(alertId).populate('approvedBy', 'name');
  if (!alert) throw Object.assign(new Error('Alert not found'), { statusCode: 404 });

  if (alert.status !== 'APPROVED') {
    throw Object.assign(new Error(`Cannot broadcast an alert with status: ${alert.status}. It must be APPROVED first.`), { statusCode: 400 });
  }

  const prev = { status: alert.status };
  alert.status = 'BROADCAST';
  alert.broadcastAt = new Date();
  alert.expiresAt   = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await alert.save();

  if (io) {
    const payload = {
      _id: alert._id,
      alertId: alert._id,
      title: alert.title,
      message: alert.message,
      riskLevel: alert.riskLevel,
      village: alert.village,
      district: alert.district,
      state: alert.state,
      status: alert.status,
      preventionActions: alert.preventionActions,
      broadcastAt: alert.broadcastAt,
    };
    io.emit('ALERT_BROADCAST', payload);
    io.to(`location:${alert.district}`).emit('ALERT_BROADCAST', payload);
    io.to('role:HEALTH_WORKER').emit('ALERT_BROADCAST', { alertId: alert._id, title: alert.title, riskLevel: alert.riskLevel, district: alert.district });
    io.to('role:NATIONAL_ADMIN').emit('ALERT_BROADCAST', { alertId: alert._id, title: alert.title, riskLevel: alert.riskLevel, district: alert.district });
  }

  await Promise.all([
    auditService.record({
      actorId: adminId, actorRole: 'NATIONAL_ADMIN',
      action: 'ALERT_BROADCAST',
      entityType: 'Alert', entityId: alert._id,
      previousValue: prev, newValue: { status: 'BROADCAST', broadcastAt: alert.broadcastAt },
      village: alert.village, district: alert.district,
    }),
    timelineService.createEvent({
      village: alert.village, district: alert.district, state: alert.state,
      eventType: 'ALERT_BROADCAST',
      summary: 'Community alert broadcast by National Admin — community notified in real time',
      relatedEntityId: alert._id, relatedEntityType: 'Alert',
      riskLevel: alert.riskLevel, actorId: adminId, actorRole: 'NATIONAL_ADMIN',
    }),
  ]);

  return alert;
};

const rejectAlert = async (alertId, userId, reason, userRole) => {
  const alert = await Alert.findById(alertId);
  if (!alert) throw Object.assign(new Error('Alert not found'), { statusCode: 404 });

  const rejectableStatuses = ['PENDING_REVIEW', 'VERIFIED', 'APPROVED'];
  if (!rejectableStatuses.includes(alert.status)) {
    throw Object.assign(new Error(`Cannot reject an alert with status: ${alert.status}`), { statusCode: 400 });
  }

  const prev = { status: alert.status };
  alert.status = 'REJECTED';
  alert.rejectedAt = new Date();
  alert.rejectionReason = reason || 'No reason provided';
  await alert.save();

  await Promise.all([
    auditService.record({
      actorId: userId, actorRole: userRole || 'HEALTH_WORKER',
      action: 'ALERT_REJECTED',
      entityType: 'Alert', entityId: alert._id,
      previousValue: prev, newValue: { status: 'REJECTED', reason: alert.rejectionReason },
      village: alert.village, district: alert.district,
    }),
    timelineService.createEvent({
      village: alert.village, district: alert.district, state: alert.state,
      eventType: 'ALERT_REJECTED',
      summary: `Alert rejected: "${alert.rejectionReason}"`,
      relatedEntityId: alert._id, relatedEntityType: 'Alert',
      riskLevel: alert.riskLevel, actorId: userId,
    }),
  ]);

  return alert;
};

const expireAlert = async (alertId, adminId) => {
  const alert = await Alert.findById(alertId);
  if (!alert) throw Object.assign(new Error('Alert not found'), { statusCode: 404 });
  alert.status = 'EXPIRED';
  alert.expiresAt = new Date();
  await alert.save();

  await auditService.record({
    actorId: adminId, actorRole: 'NATIONAL_ADMIN',
    action: 'ALERT_EXPIRED',
    entityType: 'Alert', entityId: alert._id,
    newValue: { status: 'EXPIRED' },
    village: alert.village, district: alert.district,
  });

  return alert;
};

const getPreventionActions = (riskLevel) => {
  const base = [
    'Boil water before drinking',
    'Wash hands frequently with soap',
    'Avoid open defecation',
  ];
  if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
    return [
      ...base,
      'Seek immediate medical attention if experiencing diarrhea, vomiting, or dehydration',
      'Use only bottled or boiled water',
      'Report any unusual illness to your local health worker',
      'Avoid consuming food from potentially contaminated sources',
    ];
  }
  return base;
};

module.exports = {
  createPotentialAlert,
  verifyAlert,
  approveAlert,
  broadcastAlert,
  rejectAlert,
  expireAlert,
};
