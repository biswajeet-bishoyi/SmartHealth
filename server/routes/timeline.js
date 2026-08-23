const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const timelineService = require('../services/timelineService');

// GET /api/timeline — get timeline for a location
router.get('/', requireAuth, requireRole(['HEALTH_WORKER', 'NATIONAL_ADMIN']), async (req, res, next) => {
  try {
    const { village, district, page = 1, limit = 100 } = req.query;
    if (!village || !district) return res.status(400).json({ success: false, message: 'village and district required' });
    const result = await timelineService.getForLocation({ village, district, page: +page, limit: +limit });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

module.exports = router;
