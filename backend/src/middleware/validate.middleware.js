const { ERROR_CODES } = require('../utils/constants');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: error.details.map(d => d.message).join(', ')
      }
    });
  }
  next();
};

module.exports = validate;
