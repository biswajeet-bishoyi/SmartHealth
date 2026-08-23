const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const auditService = require('../services/auditService');

// GET /api/audit — paginated audit log (Admin only)
router.get('/', requireAuth, requireRole('NATIONAL_ADMIN'), async (req, res, next) => {
  try {
    const { actorId, action, entityType, village, district, startDate, endDate, page = 1, limit = 50 } = req.query;
    const result = await auditService.getAuditLogs({ actorId, action, entityType, village, district, startDate, endDate, page: +page, limit: +limit });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

module.exports = router;
