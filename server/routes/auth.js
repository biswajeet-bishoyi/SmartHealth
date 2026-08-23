const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, registerRules, loginRules } = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.get('/me', requireAuth, getMe);
router.patch('/profile', requireAuth, updateProfile);

module.exports = router;
