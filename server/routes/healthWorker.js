const express = require('express');
const router = express.Router();
const hw = require('../controllers/healthWorkerController');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');

router.use(requireAuth);
router.use(requireRole('HEALTH_WORKER', 'NATIONAL_ADMIN'));

router.get('/dashboard', hw.getDashboard);
router.get('/reports/trends', hw.getReportTrends);
router.patch('/reports/:id/verify', hw.verifyReportRules, validate, hw.verifyReport);
router.get('/risk', hw.getRisk);
router.post('/alerts', hw.createAlert);
router.patch('/alerts/:id/verify', hw.verifyAlert);

module.exports = router;
