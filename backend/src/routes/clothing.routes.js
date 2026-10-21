const express = require('express');
const {
  getClothing,
  getSingleClothing,
  createClothing,
  updateClothing,
  updateClothingStatus,
  deleteClothing,
  getAvailability
} = require('../controllers/clothing.controller');
const validate = require('../middleware/validate.middleware');
const {
  createClothingSchema,
  updateClothingSchema,
  updateClothingStatusSchema
} = require('../validators/clothing.validator');
const { protect, admin } = require('../middleware/auth.middleware');

const router = express.Router();

router.route('/')
  .get(getClothing)
  .post(protect, admin, validate(createClothingSchema), createClothing);

router.route('/:id')
  .get(getSingleClothing)
  .put(protect, admin, validate(updateClothingSchema), updateClothing)
  .delete(protect, admin, deleteClothing);

router.route('/:id/status')
  .put(protect, admin, validate(updateClothingStatusSchema), updateClothingStatus)
  .patch(protect, admin, validate(updateClothingStatusSchema), updateClothingStatus);

router.get('/:id/availability', getAvailability);

module.exports = router;
