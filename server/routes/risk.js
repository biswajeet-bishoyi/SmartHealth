const express = require('express');
const router = express.Router();
const riskEngine = require('../services/riskEngine');
const { sendSuccess } = require('../utils/response');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const RiskAssessment = require('../models/RiskAssessment');
const DataQualityAssessment = require('../models/DataQualityAssessment');
const explanationService = require('../services/explanationService');

// GET /api/risk — Public endpoint for map data (aggregated, no PII)
router.get('/', async (req, res, next) => {
  try {
    const { state, district, riskLevel } = req.query;
    const assessments = await riskEngine.getLatestByLocation({ state, district, riskLevel });
    sendSuccess(res, 200, { assessments });
  } catch (error) {
    next(error);
  }
});

// GET /api/risk/:id — Single assessment (Health Worker / Admin only)
router.get('/:id', requireAuth, requireRole(['HEALTH_WORKER', 'NATIONAL_ADMIN']), async (req, res, next) => {
  try {
    const assessment = await RiskAssessment.findById(req.params.id).lean();
    if (!assessment) return res.status(404).json({ success: false, message: 'Risk assessment not found' });

    // Fetch linked data quality assessment
    const quality = await DataQualityAssessment.findOne({ riskAssessmentId: assessment._id }).lean();

    res.json({ success: true, data: { assessment, quality } });
  } catch (err) { next(err); }
});

// GET /api/risk/:id/explanation — Explanation for an assessment
router.get('/:id/explanation', requireAuth, requireRole(['HEALTH_WORKER', 'NATIONAL_ADMIN']), async (req, res, next) => {
  try {
    const explanation = await explanationService.getByAssessmentId(req.params.id);
    if (!explanation) {
      // Try to generate on demand if the assessment exists
      const assessment = await RiskAssessment.findById(req.params.id).lean();
      if (!assessment) return res.status(404).json({ success: false, message: 'Risk assessment not found' });
      const generated = await explanationService.generateForAssessment(assessment);
      return res.json({ success: true, data: generated });
    }
    res.json({ success: true, data: explanation });
  } catch (err) { next(err); }
});

module.exports = router;
