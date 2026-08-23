const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

/**
 * validate middleware
 * Runs after express-validator rules in a route.
 * Returns 400 with first validation error if any.
 *
 * Usage:
 *   router.post('/route', [body('field').notEmpty()], validate, controller)
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    return sendError(res, 400, first.msg);
  }
  next();
};

module.exports = validate;
