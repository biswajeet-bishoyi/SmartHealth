const Alert = require('../models/Alert');
const alertService = require('../services/alertService');
const notificationService = require('../services/notificationService');
const HealthReport = require('../models/HealthReport');
const WaterReport = require('../models/WaterReport');
const RiskAssessment = require('../models/RiskAssessment');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * GET /api/admin/dashboard
 * High-level summary for the national admin.
 */
const getDashboard = async (req, res, next) => {
  try {
    const [
      totalReports,
      totalUsers,
      activeAlerts,
      broadcastAlerts,
      highRiskVillages,
    ] = await Promise.all([
      HealthReport.countDocuments(),
      User.countDocuments({ role: 'COMMUNITY_MEMBER' }),
      Alert.countDocuments({ status: { $in: ['PENDING_REVIEW', 'VERIFIED', 'APPROVED'] } }),
      Alert.countDocuments({ status: 'BROADCAST' }),
      RiskAssessment.aggregate([
        { $sort: { calculatedAt: -1 } },
        { $group: { _id: { village: '$village', district: '$district' }, latest: { $first: '$$ROOT' } } },
        { $match: { 'latest.riskLevel': { $in: ['HIGH', 'CRITICAL'] } } },
        { $count: 'count' },
      ]),
    ]);

    sendSuccess(res, 200, {
      totalReports,
      totalUsers,
      activeAlerts,
      broadcastAlerts,
      highRiskVillages: highRiskVillages[0]?.count || 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/analytics
 * Aggregated analytics for charts and maps.
 */
const getAnalytics = async (req, res, next) => {
  try {
    const { state, district, days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const matchFilter = { createdAt: { $gte: since } };
    if (state) matchFilter.state = state;
    if (district) matchFilter.district = district;

    const [reportsByDay, byState, byDistrict, symptomDist, waterIssueDist, riskDist] = await Promise.all([
      // Reports per day
      HealthReport.aggregate([
        { $match: matchFilter },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      // By state
      HealthReport.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$state', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // By district
      HealthReport.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$district', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Symptom distribution
      HealthReport.aggregate([
        { $match: matchFilter },
        { $unwind: '$symptoms' },
        { $group: { _id: '$symptoms', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Water issue distribution
      WaterReport.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$issueType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Risk level distribution (latest per village)
      RiskAssessment.aggregate([
        { $sort: { calculatedAt: -1 } },
        { $group: { _id: { village: '$village', district: '$district' }, latest: { $first: '$$ROOT' } } },
        { $group: { _id: '$latest.riskLevel', count: { $sum: 1 } } },
      ]),
    ]);

    sendSuccess(res, 200, {
      reportsByDay,
      byState,
      byDistrict,
      symptomDistribution: symptomDist,
      waterIssueDistribution: waterIssueDist,
      riskDistribution: riskDist,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const filter = role ? { role } : {};
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    sendSuccess(res, 200, {
      users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/alerts/:id/approve — VERIFIED → APPROVED
 */
const approveAlert = async (req, res, next) => {
  try {
    const alert = await alertService.approveAlert(req.params.id, req.user.id);
    const io = req.app.get('io');
    notificationService.notifyAlertApproved(io, alert);
    sendSuccess(res, 200, { alert });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/alerts/:id/broadcast — APPROVED → BROADCAST
 * Final gate — only admin can trigger community-visible broadcast.
 */
const broadcastAlert = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const alert = await alertService.broadcastAlert(req.params.id, req.user.id, io);
    sendSuccess(res, 200, { alert });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/alerts/:id/reject
 */
const rejectAlert = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const alert = await alertService.rejectAlert(req.params.id, req.user.id, reason);
    sendSuccess(res, 200, { alert });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/alerts/:id/expire
 */
const expireAlert = async (req, res, next) => {
  try {
    const alert = await alertService.expireAlert(req.params.id, req.user.id);
    sendSuccess(res, 200, { alert });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:id/toggle-active
 */
const toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found');
    user.isActive = !user.isActive;
    await user.save();
    sendSuccess(res, 200, { user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getAnalytics,
  getUsers,
  approveAlert,
  broadcastAlert,
  rejectAlert,
  expireAlert,
  toggleUserActive,
};
