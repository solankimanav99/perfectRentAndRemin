const express = require('express');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/category.controller');
const validate = require('../middleware/validate.middleware');
const { createCategorySchema, updateCategorySchema } = require('../validators/category.validator');
const devAdminAuth = require('../middleware/dev-auth.middleware');

const router = express.Router();

router.route('/')
  .get(getCategories)
  .post(devAdminAuth, validate(createCategorySchema), createCategory);

router.route('/:id')
  .put(devAdminAuth, validate(updateCategorySchema), updateCategory)
  .delete(devAdminAuth, deleteCategory);

module.exports = router;
