const CommunityQuery = require('../models/CommunityQuery');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * GET /api/queries
 * - Public/Community: Returns FAQs (isCommonQuestion: true) and user's own queries.
 * - Health Worker / Admin: Returns all queries or filtered by district/status.
 */
const getQueries = async (req, res, next) => {
  try {
    const { status, isCommonQuestion, category, district } = req.query;
    const filter = {};

    if (isCommonQuestion !== undefined) {
      filter.isCommonQuestion = isCommonQuestion === 'true';
    }

    if (category) filter.category = category;
    if (district) filter.district = district;
    if (status) filter.status = status;

    // If Community Member, show common questions + their own questions
    if (req.user && req.user.role === 'COMMUNITY_MEMBER' && isCommonQuestion !== 'true') {
      const userQueries = await CommunityQuery.find({ userId: req.user.id })
        .sort({ createdAt: -1 });
      const commonQueries = await CommunityQuery.find({ isCommonQuestion: true })
        .sort({ answeredAt: -1 });
      return sendSuccess(res, 200, { userQueries, commonQueries });
    }

    const queries = await CommunityQuery.find(filter)
      .populate('answeredBy', 'name role')
      .sort({ createdAt: -1 });

    sendSuccess(res, 200, { queries });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/queries
 * Community member posts a new query.
 */
const createQuery = async (req, res, next) => {
  try {
    const { question, category, village, district, state } = req.body;

    if (!question || question.trim().length < 5) {
      return sendError(res, 400, 'Please enter a valid question (at least 5 characters).');
    }

    const query = await CommunityQuery.create({
      userId: req.user.id,
      userName: req.user.name || 'Community Resident',
      village: village || req.user.village || 'Majuli Village',
      district: district || req.user.district || 'Kamrup',
      state: state || req.user.state || 'Assam',
      category: category || 'general',
      question: question.trim(),
      status: 'PENDING',
    });

    const io = req.app.get('io');
    if (io) {
      io.to('role:HEALTH_WORKER').emit('NEW_COMMUNITY_QUERY', query);
      io.to('role:NATIONAL_ADMIN').emit('NEW_COMMUNITY_QUERY', query);
    }

    sendSuccess(res, 201, { query });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/queries/:id/answer
 * Health worker / Admin submits an official response and can toggle isCommonQuestion.
 */
const answerQuery = async (req, res, next) => {
  try {
    const { answer, isCommonQuestion } = req.body;

    if (!answer || answer.trim().length < 5) {
      return sendError(res, 400, 'Please provide a comprehensive answer.');
    }

    const query = await CommunityQuery.findById(req.params.id);
    if (!query) return sendError(res, 404, 'Inquiry not found.');

    query.answer = answer.trim();
    query.status = 'ANSWERED';
    query.answeredBy = req.user.id;
    query.answeredByName = req.user.name || 'Accredited Health Officer';
    query.answeredAt = new Date();

    if (isCommonQuestion !== undefined) {
      query.isCommonQuestion = Boolean(isCommonQuestion);
    }

    await query.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('QUERY_ANSWERED', query);
    }

    sendSuccess(res, 200, { query });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/queries/:id/toggle-common
 * Toggle whether an answered question is featured on the Common Questions FAQ page.
 */
const toggleCommonQuestion = async (req, res, next) => {
  try {
    const query = await CommunityQuery.findById(req.params.id);
    if (!query) return sendError(res, 404, 'Inquiry not found.');

    query.isCommonQuestion = !query.isCommonQuestion;
    await query.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('FAQ_UPDATED', query);
    }

    sendSuccess(res, 200, { query });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQueries,
  createQuery,
  answerQuery,
  toggleCommonQuestion,
};
