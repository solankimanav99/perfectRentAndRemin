const Joi = require('joi');

const updateProfileSchema = Joi.object({
  name: Joi.string().trim(),
  phone: Joi.string().trim().allow('', null)
}).unknown(false); // Do not allow unknown fields so users can't try to sneak in email or role

module.exports = {
  updateProfileSchema
};
