const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const { extractFields } = require('../services/speech/ISpeechToTextProvider');
const HealthReport = require('../models/HealthReport');
const timelineService = require('../services/timelineService');

/**
 * POST /api/voice/extract
 * -----------------------
 * Receives a transcript from the browser Web Speech API and returns
 * extracted fields for user confirmation. NEVER saves a report here —
 * user must confirm via the normal /api/reports endpoint.
 *
 * PROTOTYPE DISCLAIMER: Voice extraction is rule/keyword-based.
 * Not a validated NLP system. Always requires user confirmation.
 */
router.post('/extract', requireAuth, async (req, res, next) => {
  try {
    const { transcript, village, district, state } = req.body || {};
    if (!transcript) return res.status(400).json({ success: false, message: 'transcript required' });

    const userContext = {
      village: village || req.user?.village || 'Majuli Village',
      district: district || req.user?.district || 'Kamrup',
      state: state || req.user?.state || 'Assam',
    };

    const extracted = extractFields(transcript, userContext);

    res.json({
      success: true,
      data: {
        transcript,
        extracted,
        isPrototype: true,
        disclaimer: 'Voice extraction is an experimental prototype feature. Please review and confirm all fields before submitting.',
        providerName: 'Rule/keyword-based extraction (not medically validated NLP)',
      },
    });
  } catch (err) { next(err); }
});

/**
 * POST /api/channels/mock-inbound
 * --------------------------------
 * Admin/dev-only endpoint for testing SMS and IVR inbound message handling.
 * PROTOTYPE DISCLAIMER: No real telecom integration. Admin testing only.
 */
router.post('/mock-inbound', requireAuth, requireRole('NATIONAL_ADMIN'), async (req, res, next) => {
  try {
    const { channel, payload } = req.body;
    const { smsAdapter, ivrAdapter } = require('../services/channels/IChannelAdapter');

    let adapter;
    if (channel === 'SMS') adapter = smsAdapter;
    else if (channel === 'IVR') adapter = ivrAdapter;
    else return res.status(400).json({ success: false, message: 'channel must be SMS or IVR' });

    const parsed = adapter.receive({ ...payload, userId: req.user.userId });

    res.json({
      success: true,
      data: {
        channelName: adapter.channelName(),
        isMock: adapter.isMock(),
        parsed,
        disclaimer: 'This is a prototype mock inbound channel adapter. No real telecom provider is connected.',
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;
