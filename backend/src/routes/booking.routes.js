const express = require('express');
const { protect, admin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  createBookingSchema,
  updateBookingStatusSchema
} = require('../validators/booking.validator');
const {
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus
} = require('../controllers/booking.controller');

const router = express.Router();

// Customer booking creation
router.post('/', protect, validate(createBookingSchema), createBooking);

// List bookings (caller's own bookings)
router.get('/', protect, getBookings);

// Get single booking by ID
router.get('/:id', protect, getBookingById);

// Cancel booking (Customer or Admin)
router.put('/:id/cancel', protect, cancelBooking);

// Update booking status (Admin only)
router.put('/:id/status', protect, admin, validate(updateBookingStatusSchema), updateBookingStatus);

module.exports = router;
