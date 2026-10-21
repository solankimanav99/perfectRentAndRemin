const mongoose = require('mongoose');
const Clothing = require('../models/Clothing');
const Category = require('../models/Category');
const Booking = require('../models/Booking');
const Return = require('../models/Return');
const { ERROR_CODES } = require('../utils/constants');

// @desc    Get all clothing
// @route   GET /api/clothing
// @access  Public
const getClothing = async (req, res, next) => {
  try {
    const { 
      search, category, size, color, 
      minPrice, maxPrice, availability, 
      startDate, endDate, 
      page = 1, limit = 12 
    } = req.query;

    if (startDate || endDate) {
      return res.status(501).json({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Date-based availability is not implemented in Phase 1'
        }
      });
    }

    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      // Allow searching by category ObjectId or Name. Assuming ObjectId if valid hex.
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.categoryId = category;
      } else {
        const categoryDoc = await Category.findOne({ name: category });
        if (categoryDoc) query.categoryId = categoryDoc._id;
        else query.categoryId = null; // No match
      }
    }
    if (size) query.size = size;
    if (color) query.color = { $regex: color, $options: 'i' };
    if (minPrice || maxPrice) {
      query.rentalPrice = {};
      if (minPrice) query.rentalPrice.$gte = Number(minPrice);
      if (maxPrice) query.rentalPrice.$lte = Number(maxPrice);
    }
    if (availability !== undefined) {
      if (availability === 'true') {
         query.availabilityStatus = 'AVAILABLE';
         query.quantity = { $gt: 0 };
      } else if (availability === 'false') {
         query.$or = [
           { availabilityStatus: { $ne: 'AVAILABLE' } },
           { quantity: { $lte: 0 } }
         ];
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;

    const totalItems = await Clothing.countDocuments(query);
    
    // In API_ENDPOINTS.md, it expects category to be populated with {id, name}
    const clothes = await Clothing.find(query)
      .populate('categoryId', 'name')
      .skip(startIndex)
      .limit(limitNum)
      .sort({ createdAt: -1 }); // Default sorting, assuming newest first if not specified
      
    // Set availableQuantity = quantity for now (mock) as per requirement to not fake booking-based availability,
    // but the contract expects availableQuantity in the response structure.
    const mappedClothes = clothes.map(c => {
       const obj = c.toJSON();
       obj.availableQuantity = obj.quantity; // Not date-specific, just raw quantity
       return obj;
    });

    res.json({
      success: true,
      data: {
        items: mappedClothes,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems,
          totalPages: Math.ceil(totalItems / limitNum) || 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single clothing
// @route   GET /api/clothing/:id
// @access  Public
const getSingleClothing = async (req, res, next) => {
  try {
    const clothing = await Clothing.findById(req.params.id).populate('categoryId', 'name');
    if (!clothing) {
      return res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.CLOTHING_NOT_FOUND, message: 'Clothing item not found' }
      });
    }
    const obj = clothing.toJSON();
    obj.availableQuantity = obj.quantity;

    res.json({
      success: true,
      data: obj
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create clothing
// @route   POST /api/clothing
// @access  Private/Admin
const createClothing = async (req, res, next) => {
  try {
    const categoryExists = await Category.findById(req.body.categoryId);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.CATEGORY_NOT_FOUND, message: 'Category not found' }
      });
    }

    const clothing = await Clothing.create(req.body);
    const populatedClothing = await Clothing.findById(clothing._id).populate('categoryId', 'name');
    
    const obj = populatedClothing.toJSON();
    obj.availableQuantity = obj.quantity;

    res.status(201).json({
      success: true,
      message: 'Clothing created successfully.',
      data: obj
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update clothing
// @route   PUT /api/clothing/:id
// @access  Private/Admin
const updateClothing = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.INVALID_ID, message: 'Invalid clothing ID format' }
      });
    }

    const clothing = await Clothing.findById(id);
    if (!clothing) {
      return res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.CLOTHING_NOT_FOUND, message: 'Clothing item not found' }
      });
    }

    // Clean categoryId if passed as populated object
    if (req.body.categoryId && typeof req.body.categoryId === 'object') {
      req.body.categoryId = req.body.categoryId.id || req.body.categoryId._id;
    }

    if (req.body.categoryId && req.body.categoryId !== clothing.categoryId.toString()) {
       const categoryExists = await Category.findById(req.body.categoryId);
       if (!categoryExists) {
         return res.status(404).json({
           success: false,
           error: { code: ERROR_CODES.CATEGORY_NOT_FOUND, message: 'Category not found' }
         });
       }
    }

    // Check for quantity reduction (Phase 1 constraint)
    if (req.body.quantity !== undefined && req.body.quantity < clothing.quantity) {
       return res.status(501).json({
         success: false,
         error: {
           code: 'NOT_IMPLEMENTED',
           message: 'Inventory reduction validation against active bookings is not implemented in Phase 1.'
         }
       });
    }

    // Strip read-only or extra properties if present
    delete req.body.id;
    delete req.body._id;
    delete req.body.category;
    delete req.body.availableQuantity;
    delete req.body.createdAt;
    delete req.body.updatedAt;
    delete req.body.__v;

    Object.assign(clothing, req.body);
    await clothing.save();

    const populatedClothing = await Clothing.findById(clothing._id).populate('categoryId', 'name');
    const obj = populatedClothing.toJSON();
    obj.availableQuantity = obj.quantity;

    res.json({
      success: true,
      message: 'Clothing updated successfully.',
      data: obj
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update clothing availability status (Activate / Deactivate)
// @route   PATCH /api/clothing/:id/status
// @access  Private/Admin
const updateClothingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { availabilityStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.INVALID_ID, message: 'Invalid clothing ID format' }
      });
    }

    const clothing = await Clothing.findById(id);
    if (!clothing) {
      return res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.CLOTHING_NOT_FOUND, message: 'Clothing item not found' }
      });
    }

    clothing.availabilityStatus = availabilityStatus;
    await clothing.save();

    const populatedClothing = await Clothing.findById(clothing._id).populate('categoryId', 'name');
    const obj = populatedClothing.toJSON();
    obj.availableQuantity = obj.quantity;

    res.json({
      success: true,
      message: `Clothing ${availabilityStatus === 'AVAILABLE' ? 'activated' : 'deactivated'} successfully.`,
      data: obj
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete clothing
// @route   DELETE /api/clothing/:id
// @access  Private/Admin
const deleteClothing = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_ID,
          message: 'Invalid clothing ID format'
        }
      });
    }

    const clothing = await Clothing.findById(id);
    if (!clothing) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.CLOTHING_NOT_FOUND,
          message: 'Clothing item not found'
        }
      });
    }

    // Check for active / reservable bookings
    // Reservable statuses per BR-030: PENDING, CONFIRMED, PICKED_UP, OVERDUE
    const activeBookingsCount = await Booking.countDocuments({
      clothingId: id,
      status: { $in: ['PENDING', 'CONFIRMED', 'PICKED_UP', 'OVERDUE'] }
    });

    if (activeBookingsCount > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: ERROR_CODES.CLOTHING_HAS_ACTIVE_BOOKINGS,
          message: `Cannot delete "${clothing.name}" because it has ${activeBookingsCount} active or upcoming reservation(s). Complete or cancel active reservations first, or deactivate the item.`
        }
      });
    }

    // Check for historical bookings or returns
    const historicalBookingsCount = await Booking.countDocuments({
      clothingId: id
    });
    const returnRecordsCount = await Return.countDocuments({
      clothingId: id
    });

    if (historicalBookingsCount > 0 || returnRecordsCount > 0) {
      clothing.availabilityStatus = 'UNAVAILABLE';
      await clothing.save();

      return res.status(200).json({
        success: true,
        message: 'Clothing marked as unavailable.',
        data: {
          id: clothing._id.toString(),
          availabilityStatus: 'UNAVAILABLE'
        }
      });
    }

    // No bookings or returns exist: safe to permanently delete
    await Clothing.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Clothing deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get clothing availability
// @route   GET /api/clothing/:id/availability
// @access  Public
const getAvailability = async (req, res, next) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Date-based availability checks are not implemented in Phase 1.'
    }
  });
};

module.exports = {
  getClothing,
  getSingleClothing,
  createClothing,
  updateClothing,
  updateClothingStatus,
  deleteClothing,
  getAvailability
};
