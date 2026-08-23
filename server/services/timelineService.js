/**
 * timelineService.js
 * ------------------
 * Writes TimelineEvent records as side effects of existing write paths.
 * Called from: report creation, verification, alert transitions, response updates.
 * NOT maintained separately — auto-populated to avoid drift.
 */

const TimelineEvent = require('../models/TimelineEvent');

const createEvent = async ({
  village, district, state,
  eventType, summary,
  relatedEntityId, relatedEntityType,
  riskLevel,
  actorId, actorRole,
  occurredAt,
}) => {
  try {
    await TimelineEvent.create({
      village, district, state,
      eventType, summary,
      relatedEntityId, relatedEntityType,
      riskLevel,
      actorId, actorRole,
      occurredAt: occurredAt || new Date(),
    });
  } catch (err) {
    console.error('[timelineService] Failed to write timeline event:', err.message);
  }
};

const getForLocation = async ({ village, district, page = 1, limit = 100 }) => {
  const skip = (page - 1) * limit;
  const [events, total] = await Promise.all([
    TimelineEvent.find({ village, district })
      .sort({ occurredAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('actorId', 'name role')
      .lean(),
    TimelineEvent.countDocuments({ village, district }),
  ]);
  return { events, total, page, pages: Math.ceil(total / limit) };
};

module.exports = { createEvent, getForLocation };
