const { body } = require('express-validator');
const authService = require('../services/authService');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, state, district, village, language } = req.body;
    const { user, token } = await authService.register({
      name, email, phone, password, role, state, district, village, language,
    });
    sendSuccess(res, 201, { user, token });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login({ email, password });
    sendSuccess(res, 200, { user, token });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile (no password).
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 404, 'User not found');
    sendSuccess(res, 200, { user });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/auth/profile
 * Update own profile (name, phone, village, language)
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, village, district, state, language } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, village, district, state, language },
      { new: true, runValidators: true }
    );
    sendSuccess(res, 200, { user });
  } catch (error) {
    next(error);
  }
};

// Validation rules
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['COMMUNITY_MEMBER', 'HEALTH_WORKER', 'NATIONAL_ADMIN'])
    .withMessage('Invalid role'),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = { register, login, getMe, updateProfile, registerRules, loginRules };
