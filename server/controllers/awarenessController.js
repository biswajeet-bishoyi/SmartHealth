const AwarenessContent = require('../models/AwarenessContent');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * GET /api/awareness
 * Public endpoint — no auth required.
 * Filter by category and language.
 */
const getContent = async (req, res, next) => {
  try {
    const { category, language = 'en', page = 1, limit = 20 } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (language) filter.language = language;

    const skip = (page - 1) * limit;
    const [content, total] = await Promise.all([
      AwarenessContent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      AwarenessContent.countDocuments(filter),
    ]);

    sendSuccess(res, 200, {
      content,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/awareness (admin only)
 */
const createContent = async (req, res, next) => {
  try {
    const { title, description, category, language, source, image } = req.body;
    const content = await AwarenessContent.create({ title, description, category, language, source, image });
    sendSuccess(res, 201, { content });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/awareness/:id (admin only)
 */
const deleteContent = async (req, res, next) => {
  try {
    const content = await AwarenessContent.findByIdAndDelete(req.params.id);
    if (!content) return sendError(res, 404, 'Content not found');
    sendSuccess(res, 200, { message: 'Content deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getContent, createContent, deleteContent };
