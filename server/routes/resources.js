const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const resourceService = require('../services/resourceService');
const RiskAssessment = require('../models/RiskAssessment');

// GET /api/resources — list resources
router.get('/', requireAuth, requireRole('NATIONAL_ADMIN'), async (req, res, next) => {
  try {
    const { type, status } = req.query;
    const resources = await resourceService.getResources({ type, status });
    res.json({ success: true, data: resources });
  } catch (err) { next(err); }
});

// POST /api/resources — create resource
router.post('/', requireAuth, requireRole('NATIONAL_ADMIN'), async (req, res, next) => {
  try {
    const resource = await resourceService.createResource(req.body);
    res.status(201).json({ success: true, data: resource });
  } catch (err) { next(err); }
});

// GET /api/resources/assignments — list assignments
router.get('/assignments', requireAuth, requireRole('NATIONAL_ADMIN'), async (req, res, next) => {
  try {
    const { village, district, status, page = 1, limit = 20 } = req.query;
    const result = await resourceService.getAssignments({ village, district, status, page: +page, limit: +limit });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// POST /api/resources/assignments — assign resource to location
router.post('/assignments', requireAuth, requireRole('NATIONAL_ADMIN'), async (req, res, next) => {
  try {
    const { resourceId, responsePlanId, village, district, state } = req.body;
    if (!resourceId || !village || !district) return res.status(400).json({ success: false, message: 'resourceId, village, district required' });
    const assignment = await resourceService.assignResource({ resourceId, responsePlanId, village, district, state, assignedBy: req.user.id || req.user._id || req.user.userId });
    res.status(201).json({ success: true, data: assignment });
  } catch (err) { next(err); }
});

// PATCH /api/resources/assignments/:id — update assignment status
router.patch('/assignments/:id', requireAuth, requireRole('NATIONAL_ADMIN'), async (req, res, next) => {
  try {
    const assignment = await resourceService.updateAssignment(req.params.id, req.body, req.user.id || req.user._id || req.user.userId);
    res.json({ success: true, data: assignment });
  } catch (err) { next(err); }
});

// GET /api/resources/priority-dashboard — admin resource priority view
router.get('/priority-dashboard', requireAuth, requireRole('NATIONAL_ADMIN'), async (req, res, next) => {
  try {
    // Get latest risk assessments with HIGH/CRITICAL scores
    const assessments = await RiskAssessment.aggregate([
      { $match: { riskLevel: { $in: ['HIGH', 'CRITICAL'] } } },
      { $sort: { calculatedAt: -1 } },
      { $group: { _id: { village: '$village', district: '$district' }, latest: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$latest' } },
      { $sort: { priorityScore: -1 } },
      { $limit: 20 },
    ]);
    const dashboard = await resourceService.getPriorityDashboard(assessments);
    res.json({ success: true, data: dashboard });
  } catch (err) { next(err); }
});

module.exports = router;
