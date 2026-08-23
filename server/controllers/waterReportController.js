const { body } = require('express-validator');
const WaterReport = require('../models/WaterReport');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /api/water-reports
 */
const createWaterReport = async (req, res, next) => {
  try {
    const { state, district, village, latitude, longitude, waterSource, issueType, severity, description } = req.body;

    const report = await WaterReport.create({
      state, district, village, latitude, longitude,
      waterSource, issueType, severity, description,
      reportedBy: req.user.id,
    });

    sendSuccess(res, 201, { report });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/water-reports
 */
const getWaterReports = async (req, res, next) => {
  try {
    const { district, village, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (req.user.role === 'HEALTH_WORKER' && req.user.district) {
      filter.district = req.user.district;
    }
    if (district && req.user.role === 'NATIONAL_ADMIN') filter.district = district;
    if (village) filter.village = village;

    const skip = (page - 1) * limit;
    const [reports, total] = await Promise.all([
      WaterReport.find(filter)
        .populate('reportedBy', 'name village')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      WaterReport.countDocuments(filter),
    ]);

    sendSuccess(res, 200, {
      reports,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const createWaterReportRules = [
  body('state').trim().notEmpty().withMessage('State is required'),
  body('district').trim().notEmpty().withMessage('District is required'),
  body('village').trim().notEmpty().withMessage('Village is required'),
  body('waterSource').isIn(['river', 'well', 'hand_pump', 'tap', 'pond', 'other'])
    .withMessage('Invalid water source'),
  body('issueType').isIn(['dirty_water', 'bad_smell', 'flood_contamination', 'broken_water_source', 'suspected_contamination', 'other'])
    .withMessage('Invalid issue type'),
  body('severity').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('Invalid severity'),
];

module.exports = { createWaterReport, getWaterReports, createWaterReportRules };
