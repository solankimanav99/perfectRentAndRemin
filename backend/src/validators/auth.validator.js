const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().trim().allow('', null)
}).unknown(true); // Allow unknown fields but they won't be used/inserted if we extract properly

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

module.exports = {
  registerSchema,
  loginSchema
};
