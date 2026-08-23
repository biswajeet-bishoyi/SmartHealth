const express = require('express');
const router = express.Router();
const queryController = require('../controllers/queryController');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

// GET queries (public/authenticated)
router.get('/', requireAuth, queryController.getQueries);

// POST new query (Community member)
router.post('/', requireAuth, queryController.createQuery);

// PATCH answer query (Health Worker or Admin only)
router.patch('/:id/answer', requireAuth, requireRole(['HEALTH_WORKER', 'NATIONAL_ADMIN']), queryController.answerQuery);

// PATCH toggle show in Common Questions (Health Worker or Admin only)
router.patch('/:id/toggle-common', requireAuth, requireRole(['HEALTH_WORKER', 'NATIONAL_ADMIN']), queryController.toggleCommonQuestion);

module.exports = router;
