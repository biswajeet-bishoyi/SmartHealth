const express = require('express');
const router = express.Router();
const { createReport, getReports, getReportById, createReportRules } = require('../controllers/reportController');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { reportLimiter } = require('../middleware/rateLimiter');

// All report routes require authentication
router.use(requireAuth);

router.post('/', reportLimiter, requireRole('COMMUNITY_MEMBER', 'HEALTH_WORKER', 'NATIONAL_ADMIN'), createReportRules, validate, createReport);
router.get('/', requireRole('COMMUNITY_MEMBER', 'HEALTH_WORKER', 'NATIONAL_ADMIN'), getReports);
router.get('/:id', requireRole('COMMUNITY_MEMBER', 'HEALTH_WORKER', 'NATIONAL_ADMIN'), getReportById);

module.exports = router;
