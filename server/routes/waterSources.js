const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const waterSourceService = require('../services/waterSourceService');
const auditService = require('../services/auditService');
const timelineService = require('../services/timelineService');
const WaterSource = require('../models/WaterSource');

// GET /api/water-sources — list water sources by risk
router.get('/', requireAuth, requireRole(['HEALTH_WORKER', 'NATIONAL_ADMIN']), async (req, res, next) => {
  try {
    const { district, state, status } = req.query;
    const sources = await waterSourceService.getRiskHotspots({ district, state, status });
    res.json({ success: true, data: sources });
  } catch (err) { next(err); }
});

// GET /api/water-sources/:id — single water source
router.get('/:id', requireAuth, requireRole(['HEALTH_WORKER', 'NATIONAL_ADMIN']), async (req, res, next) => {
  try {
    const source = await WaterSource.findById(req.params.id).lean();
    if (!source) return res.status(404).json({ success: false, message: 'Water source not found' });
    res.json({ success: true, data: source });
  } catch (err) { next(err); }
});

// PATCH /api/water-sources/:id/inspect — log inspection (Health Worker)
router.patch('/:id/inspect', requireAuth, requireRole(['HEALTH_WORKER', 'NATIONAL_ADMIN']), async (req, res, next) => {
  try {
    const { result, status } = req.body;
    const source = await waterSourceService.logInspection(req.params.id, {
      result, status, inspectedBy: req.user.userId,
    });
    await Promise.all([
      auditService.record({
        actorId: req.user.userId, actorRole: req.user.role,
        action: 'WATER_SOURCE_INSPECTED',
        entityType: 'WaterSource', entityId: source._id,
        newValue: { result, status }, village: source.village, district: source.district,
      }),
      timelineService.createEvent({
        village: source.village, district: source.district, state: source.state,
        eventType: 'WATER_SOURCE_INSPECTED',
        summary: `Water source "${source.name}" inspected — status: ${status || source.status}`,
        relatedEntityId: source._id, relatedEntityType: 'WaterSource',
        actorId: req.user.userId, actorRole: req.user.role,
      }),
    ]);
    res.json({ success: true, data: source });
  } catch (err) { next(err); }
});

module.exports = router;
