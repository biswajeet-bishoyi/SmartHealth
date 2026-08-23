const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

router.use(requireAuth);
router.use(requireRole('NATIONAL_ADMIN'));

router.get('/dashboard', admin.getDashboard);
router.get('/analytics', admin.getAnalytics);
router.get('/users', admin.getUsers);
router.patch('/users/:id/toggle-active', admin.toggleUserActive);

// Alert management (admin actions)
router.patch('/alerts/:id/approve', admin.approveAlert);
router.patch('/alerts/:id/broadcast', admin.broadcastAlert);
router.patch('/alerts/:id/reject', admin.rejectAlert);
router.patch('/alerts/:id/expire', admin.expireAlert);

module.exports = router;
