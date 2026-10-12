const Joi = require('joi');

const createBookingSchema = Joi.object({
  clothingId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({ 'string.pattern.base': 'Invalid clothingId format' }),
  rentalStartDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'rentalStartDate must be in YYYY-MM-DD format' }),
  returnDate: Joi.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'returnDate must be in YYYY-MM-DD format' }),
  quantity: Joi.number()
    .integer()
    .min(1)
    .required()
});

const updateBookingStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      'PENDING',
      'CONFIRMED',
      'PICKED_UP',
      'RETURNED',
      'COMPLETED',
      'CANCELLED',
      'OVERDUE'
    )
    .required()
});

module.exports = {
  createBookingSchema,
  updateBookingStatusSchema
};
