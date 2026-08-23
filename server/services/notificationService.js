/**
 * Notification Service
 * Handles emitting Socket.IO events to connected clients and role rooms.
 */

/**
 * Notify clients of a new health report.
 */
const notifyNewReport = (io, report) => {
  if (!io) return;
  const payload = {
    reportId: report._id,
    village: report.village,
    district: report.district,
    state: report.state,
    symptoms: report.symptoms,
    affectedPeople: report.affectedPeople,
    waterSource: report.waterSource,
    createdAt: report.createdAt,
  };

  io.emit('NEW_HEALTH_REPORT', payload);
  io.to('role:HEALTH_WORKER').emit('NEW_HEALTH_REPORT', payload);
  io.to('role:NATIONAL_ADMIN').emit('NEW_HEALTH_REPORT', payload);
};

/**
 * Notify when risk level changes for a location.
 */
const notifyRiskUpdated = (io, assessment) => {
  if (!io) return;
  const payload = {
    village: assessment.village,
    district: assessment.district,
    state: assessment.state,
    riskLevel: assessment.riskLevel,
    riskScore: assessment.riskScore,
    calculatedAt: assessment.calculatedAt || new Date(),
  };

  io.emit('RISK_LEVEL_UPDATED', payload);
  io.to('role:HEALTH_WORKER').emit('RISK_LEVEL_UPDATED', payload);
  io.to('role:NATIONAL_ADMIN').emit('RISK_LEVEL_UPDATED', payload);
};

/**
 * Notify health workers when a new potential alert is created.
 */
const notifyNewAlert = (io, alert) => {
  if (!io) return;
  const payload = {
    alertId: alert._id,
    title: alert.title,
    riskLevel: alert.riskLevel,
    district: alert.district,
    village: alert.village,
    status: alert.status,
    createdAt: alert.createdAt,
  };

  io.emit('NEW_ALERT', payload);
  io.to('role:HEALTH_WORKER').emit('NEW_ALERT', payload);
  io.to('role:NATIONAL_ADMIN').emit('NEW_ALERT', payload);
};

/**
 * Notify relevant parties when an alert is approved.
 */
const notifyAlertApproved = (io, alert) => {
  if (!io) return;
  const payload = {
    alertId: alert._id,
    title: alert.title,
    riskLevel: alert.riskLevel,
    district: alert.district,
    village: alert.village,
    approvedAt: alert.approvedAt || new Date(),
  };

  io.emit('ALERT_APPROVED', payload);
  io.emit('ALERT_BROADCAST', payload);
  io.to('role:HEALTH_WORKER').emit('ALERT_APPROVED', payload);
};

module.exports = {
  notifyNewReport,
  notifyRiskUpdated,
  notifyNewAlert,
  notifyAlertApproved,
};
