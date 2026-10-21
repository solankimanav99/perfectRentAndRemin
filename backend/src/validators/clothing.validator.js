const Joi = require('joi');

const clothingBase = {
  name: Joi.string().trim().required(),
  categoryId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({'string.pattern.base': 'Invalid categoryId format'}),
  description: Joi.string().required(),
  size: Joi.string().required(),
  color: Joi.string().required(),
  rentalPrice: Joi.number().min(0).required(),
  securityDeposit: Joi.number().min(0).required(),
  quantity: Joi.number().integer().min(1).required(),
  image: Joi.string().uri().allow('').optional(),
  condition: Joi.string().valid('EXCELLENT', 'GOOD', 'FAIR', 'MAINTENANCE').required(),
  availabilityStatus: Joi.string().valid('AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE').required()
};

const createClothingSchema = Joi.object(clothingBase);

// For PUT /api/clothing/:id: strip unknown properties so frontend read-only metadata doesn't cause validation failure
const updateClothingSchema = Joi.object(clothingBase).options({ stripUnknown: true });

// For PATCH/PUT /api/clothing/:id/status
const updateClothingStatusSchema = Joi.object({
  availabilityStatus: Joi.string().valid('AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE').required()
}).options({ stripUnknown: true });

module.exports = {
  createClothingSchema,
  updateClothingSchema,
  updateClothingStatusSchema
};
