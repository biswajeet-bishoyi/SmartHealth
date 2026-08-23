const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'smarthealthne-sentinel-jwt-secret-key-2026-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a JWT token containing only userId and role.
 * JWT payload is intentionally minimal.
 */
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Register a new user.
 * Password is hashed in the User model pre-save hook — never done here.
 */
const register = async ({ name, email, phone, password, role, state, district, village, language }) => {
  const normalizedEmail = (email || '').toLowerCase().trim();
  
  // Check duplicate email
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    const err = new Error('An account with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    phone,
    password, // hashed by pre-save hook
    role: role || 'COMMUNITY_MEMBER',
    state: state || 'Assam',
    district: district || 'Kamrup',
    village: village || 'Majuli Village',
    language: language || 'en',
  });

  const token = generateToken(user);
  return { user: user.toJSON(), token };
};

/**
 * Log in an existing user.
 * Returns user (without password) and JWT token.
 */
const login = async ({ email, password }) => {
  const normalizedEmail = (email || '').toLowerCase().trim();
  
  // Must explicitly select password since select: false on schema
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    console.warn(`[Auth] Login failed: User not found for email: ${normalizedEmail}`);
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  if (!user.isActive) {
    console.warn(`[Auth] Login failed: Deactivated account for email: ${normalizedEmail}`);
    const err = new Error('Account has been deactivated. Contact an administrator.');
    err.statusCode = 403;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    console.warn(`[Auth] Login failed: Password mismatch for email: ${normalizedEmail}`);
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user);

  // Remove password from returned object
  const userObj = user.toJSON();
  console.log(`[Auth] Login successful: ${user.name} (${user.email}) [${user.role}]`);
  return { user: userObj, token };
};

module.exports = { register, login, generateToken };
