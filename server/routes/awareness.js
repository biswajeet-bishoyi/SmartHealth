const express = require('express');
const router = express.Router();
const { getContent, createContent, deleteContent } = require('../controllers/awarenessController');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

// Public read — no auth required
router.get('/', getContent);

// Admin-only write
router.post('/', requireAuth, requireRole('NATIONAL_ADMIN'), createContent);
router.delete('/:id', requireAuth, requireRole('NATIONAL_ADMIN'), deleteContent);

module.exports = router;
