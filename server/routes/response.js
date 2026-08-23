const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const responseRecommendationService = require('../services/responseRecommendationService');

// GET /api/response — list response plans
router.get('/', requireAuth, requireRole(['HEALTH_WORKER', 'NATIONAL_ADMIN']), async (req, res, next) => {
  try {
    const { village, district, status, page = 1, limit = 20 } = req.query;
    const result = await responseRecommendationService.getPlans({ village, district, status, page: +page, limit: +limit });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// POST /api/response — create a plan (system or health worker)
router.post('/', requireAuth, requireRole(['HEALTH_WORKER', 'NATIONAL_ADMIN']), async (req, res, next) => {
  try {
    const { village, district, state, riskAssessmentId, riskLevel, hasWaterContamination, vulnerabilityLevel } = req.body;
    if (!village || !district || !riskLevel) return res.status(400).json({ success: false, message: 'village, district, riskLevel required' });
    const plan = await responseRecommendationService.createPlan({ riskAssessmentId, village, district, state, riskLevel, hasWaterContamination, vulnerabilityLevel });
    if (!plan) return res.json({ success: true, data: null, message: 'Risk level not HIGH/CRITICAL — no plan created' });
    res.status(201).json({ success: true, data: plan });
  } catch (err) { next(err); }
});

// PATCH /api/response/:id — update plan status/actions
router.patch('/:id', requireAuth, requireRole(['HEALTH_WORKER', 'NATIONAL_ADMIN']), async (req, res, next) => {
  try {
    const plan = await responseRecommendationService.updatePlan(req.params.id, req.body, req.user.userId);
    res.json({ success: true, data: plan });
  } catch (err) { next(err); }
});

module.exports = router;
