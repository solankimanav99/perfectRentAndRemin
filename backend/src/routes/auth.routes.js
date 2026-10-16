const express = require('express');
const { register, login, getMe, logout } = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

if (process.env.NODE_ENV !== 'production') {
  router.post('/test-reset-rate-limit', (req, res) => {
    const ip = req.body?.ip || req.headers['x-test-client-ip'] || req.ip;
    if (authLimiter && typeof authLimiter.resetKey === 'function') {
      authLimiter.resetKey(ip);
    }
    res.json({ success: true, message: `Rate limit reset for ${ip}` });
  });
}

module.exports = router;
