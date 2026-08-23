const express = require('express');
const router = express.Router();
const { createWaterReport, getWaterReports, createWaterReportRules } = require('../controllers/waterReportController');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { reportLimiter } = require('../middleware/rateLimiter');

router.use(requireAuth);

router.post('/', reportLimiter, requireRole('COMMUNITY_MEMBER'), createWaterReportRules, validate, createWaterReport);
router.get('/', requireRole('COMMUNITY_MEMBER', 'HEALTH_WORKER', 'NATIONAL_ADMIN'), getWaterReports);

module.exports = router;
