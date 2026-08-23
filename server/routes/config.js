const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const RiskConfig = require('../models/RiskConfig');
const auditService = require('../services/auditService');
const { invalidateConfigCache } = require('../services/riskEngine');

// GET /api/config — get current risk configuration (Admin only)
router.get('/', requireAuth, requireRole('NATIONAL_ADMIN'), async (req, res, next) => {
  try {
    let config = await RiskConfig.findOne({ _singleton: 'risk_config' }).lean();
    if (!config) {
      config = (await RiskConfig.create({ _singleton: 'risk_config' })).toObject();
    }
    res.json({ success: true, data: config });
  } catch (err) { next(err); }
});

// PUT /api/config — update risk configuration (Admin only, audited)
router.put('/', requireAuth, requireRole('NATIONAL_ADMIN'), async (req, res, next) => {
  try {
    const allowedFields = ['weights', 'priorityWeights', 'thresholds', 'symptomWeights', 'timeWindowDays', 'clusterWindowHours', 'clusterThreshold', 'maxReportsForSymptom', 'maxWaterReports', 'maxGrowthRate', 'minReportsForPrediction', 'minHistoryDaysForPrediction'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const existing = await RiskConfig.findOne({ _singleton: 'risk_config' });
    const prev = existing ? existing.toObject() : {};

    const config = await RiskConfig.findOneAndUpdate(
      { _singleton: 'risk_config' },
      { ...updates, updatedBy: req.user.id || req.user._id || req.user.userId, $inc: { version: 1 } },
      { upsert: true, new: true, runValidators: true }
    );

    // Invalidate cache so riskEngine picks up new weights immediately
    invalidateConfigCache();

    await auditService.record({
      actorId: req.user.id || req.user._id || req.user.userId, actorRole: 'NATIONAL_ADMIN',
      action: 'CONFIG_UPDATED',
      entityType: 'RiskConfig', entityId: config._id,
      previousValue: prev, newValue: updates,
    });

    res.json({ success: true, data: config });
  } catch (err) { next(err); }
});

module.exports = router;
