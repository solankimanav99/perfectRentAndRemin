const express = require('express');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/category.controller');
const validate = require('../middleware/validate.middleware');
const { createCategorySchema, updateCategorySchema } = require('../validators/category.validator');
const { protect, admin } = require('../middleware/auth.middleware');

const router = express.Router();

router.route('/')
  .get(getCategories)
  .post(protect, admin, validate(createCategorySchema), createCategory);

router.route('/:id')
  .put(protect, admin, validate(updateCategorySchema), updateCategory)
  .delete(protect, admin, deleteCategory);

module.exports = router;
