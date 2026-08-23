const { sendError } = require('../utils/response');

/**
 * requireRole middleware factory.
 * Usage: requireRole('HEALTH_WORKER') or requireRole('NATIONAL_ADMIN')
 *
 * Must be used AFTER requireAuth (relies on req.user.role being set).
 * RBAC is enforced server-side here — frontend route guards are UX only.
 *
 * @param {...string} roles - One or more allowed roles
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required.');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied. This action requires one of: [${roles.join(', ')}].`
      );
    }

    next();
  };
};

module.exports = requireRole;
