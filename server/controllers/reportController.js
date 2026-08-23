const { body } = require('express-validator');
const HealthReport = require('../models/HealthReport');
const riskEngine = require('../services/riskEngine');
const alertService = require('../services/alertService');
const notificationService = require('../services/notificationService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /api/reports
 * Create a new health report.
 * After saving: recalculate risk → if HIGH/CRITICAL → create potential alert.
 */
const createReport = async (req, res, next) => {
  try {
    const {
      state, district, village, latitude, longitude,
      symptoms, waterIssues,
    } = req.body;

    const duration = req.body.duration !== undefined ? req.body.duration : (req.body.durationDays !== undefined ? req.body.durationDays : 1);
    const affectedPeople = req.body.affectedPeople || req.body.affectedCount || 1;
    const description = req.body.description || req.body.notes || (req.body.voiceTranscript ? `Voice transcript: "${req.body.voiceTranscript}"` : '');
    const sourceChannel = req.body.sourceChannel || 'APP';
    const waterSource = req.body.waterSource || 'tap';

    // Normalize symptoms
    const normalizedSymptoms = Array.isArray(symptoms)
      ? symptoms.map(s => String(s).toLowerCase().trim().replace(/ /g, '_'))
      : (symptoms ? [String(symptoms).toLowerCase().trim().replace(/ /g, '_')] : ['other']);

    const report = await HealthReport.create({
      userId: req.user.id,
      state: state || 'Assam',
      district: district || 'Kamrup',
      village: village || 'Majuli Village',
      latitude: latitude || 26.1445,
      longitude: longitude || 91.7362,
      symptoms: normalizedSymptoms,
      duration,
      affectedPeople,
      waterSource,
      waterIssues: waterIssues || ['no_issue'],
      description,
      sourceChannel,
      status: 'PENDING',
    });

    const io = req.app.get('io');

    // 1. Notify health workers of new report in real time
    notificationService.notifyNewReport(io, report);

    // 2. Recalculate risk for this location (async, don't block response)
    setImmediate(async () => {
      try {
        const assessment = await riskEngine.calculateForLocation({ village, district, state });

        // 3. Notify risk update
        notificationService.notifyRiskUpdated(io, assessment);

        // 4. If HIGH or CRITICAL → create potential alert (not auto-broadcast)
        if (assessment.riskLevel === 'HIGH' || assessment.riskLevel === 'CRITICAL') {
          // Use a system/admin user ID if available, else the reporter
          const alert = await alertService.createPotentialAlert({
            riskAssessment: assessment,
            createdByUserId: req.user.id,
          });
          if (alert) {
            notificationService.notifyNewAlert(io, alert);
          }
        }
      } catch (err) {
        console.error('[RiskEngine] Background calculation error:', err.message);
      }
    });

    sendSuccess(res, 201, { report });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports
 * Community members see their own reports.
 * Health workers see reports in their district.
 * Admins see all reports.
 */
const getReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, district, village, state } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.user.role === 'COMMUNITY_MEMBER') {
      filter.userId = req.user.id;
    } else if (req.user.role === 'HEALTH_WORKER') {
      if (req.user.district) filter.district = req.user.district;
    }

    // Additional filters
    if (status) filter.status = status;
    if (district && req.user.role === 'NATIONAL_ADMIN') filter.district = district;
    if (village) filter.village = village;
    if (state) filter.state = state;

    const [reports, total] = await Promise.all([
      HealthReport.find(filter)
        .populate('userId', 'name phone village')
        .populate('verifiedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      HealthReport.countDocuments(filter),
    ]);

    sendSuccess(res, 200, {
      reports,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/:id
 */
const getReportById = async (req, res, next) => {
  try {
    const report = await HealthReport.findById(req.params.id)
      .populate('userId', 'name phone village district')
      .populate('verifiedBy', 'name');

    if (!report) return sendError(res, 404, 'Report not found');

    // Community members can only see their own reports
    if (req.user.role === 'COMMUNITY_MEMBER' && report.userId._id.toString() !== req.user.id.toString()) {
      return sendError(res, 403, 'Access denied');
    }

    sendSuccess(res, 200, { report });
  } catch (error) {
    next(error);
  }
};

// Validation rules
const createReportRules = [
  body('state').trim().notEmpty().withMessage('State is required'),
  body('district').trim().notEmpty().withMessage('District is required'),
  body('village').trim().notEmpty().withMessage('Village is required'),
  body('symptoms').isArray({ min: 1 }).withMessage('At least one symptom is required'),
  body('symptoms.*').isIn(['diarrhea', 'vomiting', 'fever', 'abdominal_pain', 'dehydration', 'other'])
    .withMessage('Invalid symptom value'),
  body('affectedPeople').optional().isInt({ min: 1 }).withMessage('Affected people must be a positive integer'),
  body('waterSource').optional().isIn(['river', 'well', 'hand_pump', 'tap', 'pond', 'other'])
    .withMessage('Invalid water source'),
];

module.exports = { createReport, getReports, getReportById, createReportRules };
