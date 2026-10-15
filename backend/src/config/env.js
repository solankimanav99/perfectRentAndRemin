require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/perfect_rent',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_key_for_dev',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',
  ADMIN_NAME: process.env.ADMIN_NAME || 'Super Admin',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@perfectrent.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  FINE_PER_DAY: Number(process.env.FINE_PER_DAY) || 100,
  AUTH_RATE_LIMIT_WINDOW_MS: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  AUTH_RATE_LIMIT_MAX: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10
};
