const Joi = require('joi');

const createCategorySchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'any.required': 'Category name is required',
    'string.empty': 'Category name cannot be empty'
  }),
  description: Joi.string().allow('').optional()
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'any.required': 'Category name is required',
    'string.empty': 'Category name cannot be empty'
  }),
  description: Joi.string().allow('').required().messages({
    'any.required': 'Category description is required for updates'
  })
});

module.exports = {
  createCategorySchema,
  updateCategorySchema
};
