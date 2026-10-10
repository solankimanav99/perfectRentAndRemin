const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateToken = (userId, role) => {
  return jwt.sign(
    { sub: userId, role: role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

module.exports = generateToken;
