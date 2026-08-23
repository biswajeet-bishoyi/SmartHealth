const Alert = require('../models/Alert');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * GET /api/alerts
 * Community: only BROADCAST alerts in their district.
 * Health workers: all alerts in their district.
 * Admins: all alerts.
 */
const getAlerts = async (req, res, next) => {
  try {
    const { status, district, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (req.user.role === 'COMMUNITY_MEMBER') {
      filter.status = 'BROADCAST';
      if (req.user.district) filter.district = req.user.district;
    } else if (req.user.role === 'HEALTH_WORKER') {
      if (req.user.district) filter.district = req.user.district;
      if (status) filter.status = status;
    } else {
      // Admin sees all
      if (status) filter.status = status;
      if (district) filter.district = district;
    }

    const skip = (page - 1) * limit;
    const [alerts, total] = await Promise.all([
      Alert.find(filter)
        .populate('createdBy', 'name role')
        .populate('verifiedBy', 'name')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Alert.countDocuments(filter),
    ]);

    sendSuccess(res, 200, {
      alerts,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/alerts/:id
 */
const getAlertById = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('createdBy', 'name role')
      .populate('verifiedBy', 'name')
      .populate('approvedBy', 'name');

    if (!alert) return sendError(res, 404, 'Alert not found');
    sendSuccess(res, 200, { alert });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAlerts, getAlertById };
