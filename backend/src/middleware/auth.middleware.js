const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const { ERROR_CODES } = require('../utils/constants');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.AUTH_TOKEN_MISSING,
        message: 'Not authorized, token missing'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    req.user = await User.findById(decoded.sub).select('-password');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_ACCOUNT_NOT_FOUND,
          message: 'Not authorized, user account does not exist'
        }
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.AUTH_TOKEN_INVALID,
        message: 'Not authorized, token invalid or expired'
      }
    });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      error: {
        code: ERROR_CODES.FORBIDDEN,
        message: 'Not authorized as an admin'
      }
    });
  }
};

module.exports = { protect, admin };
