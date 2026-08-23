const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const environmentalRiskService = require('../services/environmentalRiskService');

// GET /api/environment — list observations for a location
router.get('/', requireAuth, requireRole(['HEALTH_WORKER', 'NATIONAL_ADMIN']), async (req, res, next) => {
  try {
    const { village, district, windowDays = 30 } = req.query;
    if (!village || !district) return res.status(400).json({ success: false, message: 'village and district required' });
    const observations = await environmentalRiskService.getObservationsForLocation(village, district, +windowDays);
    const riskScore     = await environmentalRiskService.calculateEnvironmentalRisk(village, district, 7);
    res.json({ success: true, data: { observations, riskScore, isMockData: true } });
  } catch (err) { next(err); }
});

// POST /api/environment — record a manual observation (Admin only)
router.post('/', requireAuth, requireRole('NATIONAL_ADMIN'), async (req, res, next) => {
  try {
    const obs = await environmentalRiskService.createObservation({ ...req.body, recordedBy: req.user.userId });
    res.status(201).json({ success: true, data: obs });
  } catch (err) { next(err); }
});

module.exports = router;
