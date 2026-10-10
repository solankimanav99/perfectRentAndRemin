const { ERROR_CODES } = require('../utils/constants');
const env = require('../config/env');

const devAdminAuth = (req, res, next) => {
  if ((env.NODE_ENV === 'development' || env.NODE_ENV === 'test') && req.headers['x-dev-role'] === 'ADMIN') {
    req.user = { role: 'ADMIN' };
    return next();
  }
  
  res.status(401).json({
    success: false,
    error: {
      code: ERROR_CODES.UNAUTHORIZED,
      message: 'Not authorized (Phase 1 placeholder)'
    }
  });
};

module.exports = devAdminAuth;
