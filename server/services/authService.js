const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate a JWT token containing only userId and role.
 * JWT payload is intentionally minimal.
 */
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Register a new user.
 * Password is hashed in the User model pre-save hook — never done here.
 */
const register = async ({ name, email, phone, password, role, state, district, village, language }) => {
  // Check duplicate email
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    const err = new Error('An account with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  const user = await User.create({
    name,
    email,
    phone,
    password, // hashed by pre-save hook
    role: role || 'COMMUNITY_MEMBER',
    state,
    district,
    village,
    language: language || 'en',
  });

  const token = generateToken(user);
  return { user, token };
};

/**
 * Log in an existing user.
 * Returns user (without password) and JWT token.
 */
const login = async ({ email, password }) => {
  // Must explicitly select password since select: false on schema
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error('Account has been deactivated. Contact an administrator.');
    err.statusCode = 403;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user);

  // Remove password from returned object
  const userObj = user.toJSON();
  return { user: userObj, token };
};

module.exports = { register, login, generateToken };
