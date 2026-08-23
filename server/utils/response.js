/**
 * Centralized API response helpers.
 * All controllers should use these to ensure consistent response shapes.
 */

/**
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {object} data - Response payload
 */
const sendSuccess = (res, statusCode = 200, data = {}) => {
  res.status(statusCode).json({ success: true, data });
};

/**
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Human-readable error message
 */
const sendError = (res, statusCode = 400, message = 'Something went wrong') => {
  res.status(statusCode).json({ success: false, message });
};

module.exports = { sendSuccess, sendError };
