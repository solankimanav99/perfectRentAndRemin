const { ERROR_CODES } = require('../utils/constants');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let code = err.code || ERROR_CODES.INTERNAL_SERVER_ERROR;
  let message = err.message || 'An unexpected error occurred';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    code = ERROR_CODES.INVALID_ID;
    message = 'Invalid ID format';
  }
  
  if (err.code === 11000) {
    statusCode = 400;
    // Specifically for category name unique index
    if (err.keyPattern && err.keyPattern.name) {
       code = ERROR_CODES.CATEGORY_EXISTS;
       message = 'Category already exists';
    } else {
       code = ERROR_CODES.VALIDATION_ERROR;
       message = 'Duplicate field value entered';
    }
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    }
  });
};

module.exports = errorHandler;
