const rateLimit = require('express-rate-limit');
const { ERROR_CODES } = require('../utils/constants');
const env = require('../config/env');

/**
 * Configurable rate limiter for authentication endpoints (login & registration).
 * Protects against brute-force password guessing and automated registration attacks.
 * Uses windowMs and max from environment configuration.
 * When in test environment, limits are automatically relaxed unless explicitly configured.
 */
const authLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 1000 : (env.AUTH_RATE_LIMIT_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // In dev / test, allow isolating QA test runners to prevent locking out local developers/browsers
    if (process.env.NODE_ENV !== 'production' && req.headers['x-test-client-ip']) {
      return String(req.headers['x-test-client-ip']);
    }
    return req.ip || req.socket.remoteAddress || '127.0.0.1';
  },
  message: {
    success: false,
    error: {
      code: ERROR_CODES.TOO_MANY_REQUESTS || 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts from this IP. Please try again later.'
    }
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  }
});

module.exports = { authLimiter };
