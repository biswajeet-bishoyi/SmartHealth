const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'smarthealthne-sentinel-jwt-secret-key-2026-production';

/**
 * requireAuth middleware
 * Verifies the JWT from the Authorization header.
 * Attaches req.user = { id, role } if valid.
 * Returns 401 if missing/invalid/expired.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Authentication required. Please log in.');
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 401, 'Session expired. Please log in again.');
      }
      return sendError(res, 401, 'Invalid authentication token.');
    }

    // Verify user still exists and is active
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return sendError(res, 401, 'User account not found or deactivated.');
    }

    // Attach minimal user info to request
    req.user = { id: user._id, role: user.role, district: user.district, village: user.village };
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = requireAuth;
