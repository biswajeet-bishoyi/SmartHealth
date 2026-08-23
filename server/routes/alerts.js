const express = require('express');
const router = express.Router();
const { getAlerts, getAlertById } = require('../controllers/alertController');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

router.get('/', getAlerts);
router.get('/:id', getAlertById);

module.exports = router;
