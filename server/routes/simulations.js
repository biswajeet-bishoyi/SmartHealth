const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const simulationService = require('../services/simulationService');
const RiskAssessment = require('../models/RiskAssessment');

// POST /api/simulations — run a what-if simulation (Admin only)
router.post('/', requireAuth, requireRole('NATIONAL_ADMIN'), async (req, res, next) => {
  try {
    const { village, district, state, inputs } = req.body;
    if (!village || !district) return res.status(400).json({ success: false, message: 'village and district required' });

    // Get baseline (current risk) — READ from DB, DO NOT MODIFY production data
    const baseline = await RiskAssessment.findOne({ village, district }).sort({ calculatedAt: -1 }).lean();
    if (!baseline) return res.status(404).json({ success: false, message: 'No risk assessment found for this location. Run a risk calculation first.' });

    const simulation = await simulationService.runSimulation({
      village, district, state,
      baselineAssessment: baseline,
      inputs: inputs || {},
      runBy: req.user.userId,
    });

    res.status(201).json({ success: true, data: simulation });
  } catch (err) { next(err); }
});

// GET /api/simulations — list past simulations (Admin only)
router.get('/', requireAuth, requireRole('NATIONAL_ADMIN'), async (req, res, next) => {
  try {
    const { village, district, page = 1, limit = 20 } = req.query;
    const result = await simulationService.getSimulations({ village, district, runBy: null, page: +page, limit: +limit });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

module.exports = router;
