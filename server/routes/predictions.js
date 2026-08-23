const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const predictionEngine = require('../services/predictionEngine');
const explanationService = require('../services/explanationService');
const RiskAssessment = require('../models/RiskAssessment');
const Prediction = require('../models/Prediction');

// GET /api/predictions — list predictions (Health Worker + Admin)
router.get('/', requireAuth, requireRole(['HEALTH_WORKER', 'NATIONAL_ADMIN']), async (req, res, next) => {
  try {
    const { village, district, page = 1, limit = 20 } = req.query;
    const result = await predictionEngine.getPredictions({ village, district, page: +page, limit: +limit });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// GET /api/predictions/high-risk — predicted HIGH/CRITICAL locations (Admin)
router.get('/high-risk', requireAuth, requireRole(['HEALTH_WORKER', 'NATIONAL_ADMIN']), async (req, res, next) => {
  try {
    const predictions = await predictionEngine.getHighRiskPredictions();
    res.json({ success: true, data: predictions });
  } catch (err) { next(err); }
});

// GET /api/predictions/evaluation/history — retrospective evaluation report (PRD §13, §25)
router.get('/evaluation/history', requireAuth, requireRole(['HEALTH_WORKER', 'NATIONAL_ADMIN']), async (req, res, next) => {
  try {
    const { village, district, limit = 50 } = req.query;
    const history = await predictionEngine.getEvaluationHistory({ village, district, limit: +limit });
    res.json({ success: true, data: history });
  } catch (err) { next(err); }
});

// POST /api/predictions/generate — generate prediction for a location (Admin)
router.post('/generate', requireAuth, requireRole('NATIONAL_ADMIN'), async (req, res, next) => {
  try {
    const { village, district, state, windowDays = 7 } = req.body;
    if (!village || !district) return res.status(400).json({ success: false, message: 'village and district required' });

    // Get current risk assessment
    const latest = await RiskAssessment.findOne({ village, district }).sort({ calculatedAt: -1 }).lean();
    const currentRiskScore = latest?.riskScore || 0;
    const currentRiskLevel = latest?.riskLevel || 'LOW';

    const prediction = await predictionEngine.predict({ village, district, state, currentRiskScore, currentRiskLevel, windowDays });
    res.status(201).json({ success: true, data: prediction });
  } catch (err) { next(err); }
});

// GET /api/predictions/latest — latest prediction for a location
router.get('/latest', requireAuth, requireRole(['HEALTH_WORKER', 'NATIONAL_ADMIN']), async (req, res, next) => {
  try {
    const { village, district } = req.query;
    if (!village || !district) return res.status(400).json({ success: false, message: 'village and district required' });
    const prediction = await predictionEngine.getLatestForLocation(village, district);
    res.json({ success: true, data: prediction || null });
  } catch (err) { next(err); }
});

// GET /api/predictions/:id — single prediction
router.get('/:id', requireAuth, requireRole(['HEALTH_WORKER', 'NATIONAL_ADMIN']), async (req, res, next) => {
  try {
    const pred = await Prediction.findById(req.params.id).lean();
    if (!pred) return res.status(404).json({ success: false, message: 'Prediction not found' });
    res.json({ success: true, data: pred });
  } catch (err) { next(err); }
});

// POST /api/predictions/:id/evaluate — evaluate prediction retrospectively against actual outcomes
router.post('/:id/evaluate', requireAuth, requireRole('NATIONAL_ADMIN'), async (req, res, next) => {
  try {
    const evaluated = await predictionEngine.evaluatePrediction(req.params.id);
    res.json({ success: true, data: evaluated });
  } catch (err) { next(err); }
});

// GET /api/predictions/:id/explanation
router.get('/:id/explanation', requireAuth, requireRole(['HEALTH_WORKER', 'NATIONAL_ADMIN']), async (req, res, next) => {
  try {
    const explanation = await explanationService.getByPredictionId(req.params.id);
    if (!explanation) return res.status(404).json({ success: false, message: 'Explanation not found for this prediction' });
    res.json({ success: true, data: explanation });
  } catch (err) { next(err); }
});

module.exports = router;
