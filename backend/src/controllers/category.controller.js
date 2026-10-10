const Category = require('../models/Category');
const Clothing = require('../models/Clothing');
const { ERROR_CODES } = require('../utils/constants');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!category) {
      return res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.CATEGORY_NOT_FOUND, message: 'Category not found' }
      });
    }

    res.json({
      success: true,
      message: 'Category updated successfully.',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.id;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.CATEGORY_NOT_FOUND, message: 'Category not found' }
      });
    }

    // Check if any clothing references this category
    const clothingCount = await Clothing.countDocuments({ categoryId });
    if (clothingCount > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Cannot delete category that is referenced by clothing items'
        }
      });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Category deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
