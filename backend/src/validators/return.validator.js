const Joi = require('joi');

const createReturnSchema = Joi.object({
  bookingId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({ 'string.pattern.base': 'Invalid bookingId format' }),
  actualReturnDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'actualReturnDate must be in YYYY-MM-DD format' }),
  condition: Joi.string()
    .valid('EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED')
    .required()
});

const settleReturnSchema = Joi.object({
  damageCharge: Joi.number()
    .min(0)
    .required()
});

module.exports = {
  createReturnSchema,
  settleReturnSchema
};
