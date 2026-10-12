const Joi = require('joi');
const env = require('../config/env');

const allowedMethods = ['UPI', 'CARD', 'CASH_ON_PICKUP'];
if (env.NODE_ENV !== 'production') {
  allowedMethods.push('TEST_FAIL');
}

const createPaymentSchema = Joi.object({
  bookingId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({ 'string.pattern.base': 'Invalid bookingId format' }),
  method: Joi.string()
    .valid(...allowedMethods)
    .required()
    .messages({
      'any.only': 'PAYMENT_INVALID_METHOD'
    })
});

const refundPaymentSchema = Joi.object({
  reason: Joi.string().trim().allow('').optional()
});

module.exports = {
  createPaymentSchema,
  refundPaymentSchema
};
