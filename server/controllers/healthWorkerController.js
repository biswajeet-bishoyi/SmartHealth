const { body } = require('express-validator');
const HealthReport = require('../models/HealthReport');
const Alert = require('../models/Alert');
const RiskAssessment = require('../models/RiskAssessment');
const alertService = require('../services/alertService');
const notificationService = require('../services/notificationService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * GET /api/health-worker/dashboard
 * Summary stats for health worker dashboard.
 */
const getDashboard = async (req, res, next) => {
  try {
    const districtFilter = req.user.district ? { district: req.user.district } : {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, pending, verified, todayCount, highRiskCount, activeAlerts] = await Promise.all([
      HealthReport.countDocuments(districtFilter),
      HealthReport.countDocuments({ ...districtFilter, status: 'PENDING' }),
      HealthReport.countDocuments({ ...districtFilter, status: 'VERIFIED' }),
      HealthReport.countDocuments({ ...districtFilter, createdAt: { $gte: today } }),
      RiskAssessment.aggregate([
        { $match: districtFilter },
        { $sort: { calculatedAt: -1 } },
        { $group: { _id: { village: '$village', district: '$district' }, latest: { $first: '$$ROOT' } } },
        { $match: { 'latest.riskLevel': { $in: ['HIGH', 'CRITICAL'] } } },
        { $count: 'count' },
      ]),
      Alert.countDocuments({ ...districtFilter, status: { $in: ['PENDING_REVIEW', 'VERIFIED', 'APPROVED', 'BROADCAST'] } }),
    ]);

    sendSuccess(res, 200, {
      totalReports: total,
      pendingReports: pending,
      verifiedReports: verified,
      reportsToday: todayCount,
      highRiskVillages: highRiskCount[0]?.count || 0,
      activeAlerts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/health-worker/reports/:id/verify
 * Verify or reject a report. Records verifiedBy, verifiedAt, notes.
 */
const verifyReport = async (req, res, next) => {
  try {
    const status = req.body.status || 'VERIFIED';
    const verificationNotes = req.body.verificationNotes || req.body.notes || '';
    const { id } = req.params;

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return sendError(res, 400, 'Status must be VERIFIED or REJECTED');
    }

    const report = await HealthReport.findById(id);
    if (!report) return sendError(res, 404, 'Report not found');

    if (report.status !== 'PENDING') {
      return sendError(res, 400, `Report is already ${report.status}`);
    }

    report.status = status;
    report.verifiedBy = req.user.id;
    report.verifiedAt = new Date();
    report.verificationNotes = verificationNotes || '';
    await report.save();

    sendSuccess(res, 200, { report });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/health-worker/risk
 * Latest risk assessments for health worker's district.
 */
const getRisk = async (req, res, next) => {
  try {
    const filter = req.user.district ? { district: req.user.district } : {};
    const riskEngine = require('../services/riskEngine');
    const assessments = await riskEngine.getLatestByLocation(filter);
    sendSuccess(res, 200, { assessments });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/health-worker/reports/trends
 * Reports grouped by day for the last 14 days (for charts).
 */
const getReportTrends = async (req, res, next) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 14);
    const districtFilter = req.user.district ? { district: req.user.district } : {};

    const trends = await HealthReport.aggregate([
      { $match: { ...districtFilter, createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const symptomDist = await HealthReport.aggregate([
      { $match: districtFilter },
      { $unwind: '$symptoms' },
      { $group: { _id: '$symptoms', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    sendSuccess(res, 200, { trends, symptomDistribution: symptomDist });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/health-worker/alerts
 * Health worker creates a potential alert (PENDING_REVIEW → verified by HW themselves).
 */
const createAlert = async (req, res, next) => {
  try {
    const { title, message, riskLevel, state, district, village, targetAudience, preventionActions } = req.body;

    const alert = await Alert.create({
      title,
      message,
      riskLevel,
      state,
      district,
      village,
      targetAudience: targetAudience || 'COMMUNITY',
      createdBy: req.user.id,
      status: 'PENDING_REVIEW',
      preventionActions: preventionActions || [],
    });

    const io = req.app.get('io');
    notificationService.notifyNewAlert(io, alert);

    sendSuccess(res, 201, { alert });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/health-worker/alerts/:id/verify
 */
const verifyAlert = async (req, res, next) => {
  try {
    const alert = await alertService.verifyAlert(req.params.id, req.user.id);
    sendSuccess(res, 200, { alert });
  } catch (error) {
    next(error);
  }
};

const verifyReportRules = [
  body('status').optional().isIn(['VERIFIED', 'REJECTED']).withMessage('Status must be VERIFIED or REJECTED'),
];

module.exports = {
  getDashboard,
  verifyReport,
  getRisk,
  getReportTrends,
  createAlert,
  verifyAlert,
  verifyReportRules,
};
