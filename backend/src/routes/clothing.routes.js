const express = require('express');
const {
  getClothing,
  getSingleClothing,
  createClothing,
  updateClothing,
  deleteClothing,
  getAvailability
} = require('../controllers/clothing.controller');
const validate = require('../middleware/validate.middleware');
const { createClothingSchema, updateClothingSchema } = require('../validators/clothing.validator');
const devAdminAuth = require('../middleware/dev-auth.middleware');

const router = express.Router();

router.route('/')
  .get(getClothing)
  .post(devAdminAuth, validate(createClothingSchema), createClothing);

router.route('/:id')
  .get(getSingleClothing)
  .put(devAdminAuth, validate(updateClothingSchema), updateClothing)
  .delete(devAdminAuth, deleteClothing);

router.get('/:id/availability', getAvailability);

module.exports = router;
