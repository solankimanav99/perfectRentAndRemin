const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const bookingService = require('../services/booking.service');
const { ERROR_CODES } = require('../utils/constants');
const { withTransaction } = require('../utils/transactionHelper');

// Dynamic Payment model lookup
const getPaymentModel = () => {
  try {
    return require('../models/Payment');
  } catch (err) {
    if (mongoose.models.Payment) {
      return mongoose.models.Payment;
    }
    return null;
  }
};

/**
 * POST /api/bookings (Authenticated CUSTOMER)
 */
const createBooking = async (req, res, next) => {
  try {
    const { clothingId, rentalStartDate, returnDate, quantity } = req.body;

    const booking = await bookingService.createBooking({
      customerId: req.user._id,
      clothingId,
      rentalStartDate,
      returnDate,
      quantity
    });

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully.',
      data: {
        id: booking._id.toString(),
        clothingId: booking.clothingId.toString(),
        rentalStartDate: booking.rentalStartDate.toISOString(),
        returnDate: booking.returnDate.toISOString(),
        quantity: booking.quantity,
        rentalDuration: booking.rentalDuration,
        rentalAmount: booking.rentalAmount,
        securityDeposit: booking.securityDeposit,
        totalAmount: booking.totalAmount,
        status: booking.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings (Authenticated)
 * Always returns only the caller's own bookings.
 */
const getBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = req.user.role === 'ADMIN' ? {} : { customerId: req.user._id };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/:id (Authenticated)
 * Customer can access own booking; Admin can access any.
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.BOOKING_NOT_FOUND,
          message: 'Booking not found'
        }
      });
    }

    if (req.user.role !== 'ADMIN' && booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'Access forbidden'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/bookings/:id/cancel (Authenticated CUSTOMER or ADMIN)
 */
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.cancelBooking({
      bookingId: req.params.id,
      user: req.user
    });

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.',
      data: {
        id: booking._id.toString(),
        status: booking.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/bookings/:id/status (ADMIN only)
 * Administrative transitions:
 * - PENDING -> CONFIRMED (permitted only for CASH_ON_PICKUP bookings with pending payment)
 * - CONFIRMED -> PICKED_UP (requires PAID for UPI/CARD, or atomically collects cash for CASH_ON_PICKUP)
 * - PENDING/CONFIRMED -> CANCELLED
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status: targetStatus } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.BOOKING_NOT_FOUND,
          message: 'Booking not found'
        }
      });
    }

    const currentStatus = booking.status;

    // Reject transitions owned by other workflows (returns/settlement)
    if (['RETURNED', 'COMPLETED'].includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.BOOKING_INVALID_STATUS,
          message: 'Return and completion status transitions must be processed through dedicated workflow endpoints'
        }
      });
    }

    // Cancellation via status endpoint
    if (targetStatus === 'CANCELLED') {
      if (!['PENDING', 'CONFIRMED'].includes(currentStatus)) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.BOOKING_INVALID_STATUS,
            message: 'Booking cannot be cancelled from current status'
          }
        });
      }
      booking.status = 'CANCELLED';
      await booking.save();
      return res.status(200).json({
        success: true,
        data: booking
      });
    }

    const Payment = getPaymentModel();

    // 1. PENDING -> CONFIRMED
    if (currentStatus === 'PENDING' && targetStatus === 'CONFIRMED') {
      if (!Payment) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.BOOKING_INVALID_STATUS,
            message: 'Cannot manually confirm unpaid booking without payment record'
          }
        });
      }

      const payment = await Payment.findOne({ bookingId: booking._id });
      // Only permitted if CASH_ON_PICKUP pending payment exists (BR-036)
      if (!payment || payment.method !== 'CASH_ON_PICKUP' || payment.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.BOOKING_INVALID_STATUS,
            message: 'Manual confirmation permitted only for bookings with a pending CASH_ON_PICKUP payment'
          }
        });
      }

      booking.status = 'CONFIRMED';
      await booking.save();
      return res.status(200).json({
        success: true,
        data: booking
      });
    }

    // 2. CONFIRMED -> PICKED_UP
    if (currentStatus === 'CONFIRMED' && targetStatus === 'PICKED_UP') {
      if (!Payment) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.BOOKING_INVALID_STATUS,
            message: 'Cannot pick up booking without payment verification'
          }
        });
      }

      const payment = await Payment.findOne({ bookingId: booking._id });
      if (!payment) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.BOOKING_INVALID_STATUS,
            message: 'No payment record found for this booking'
          }
        });
      }

      // Electronic payment: must already be PAID
      if (['UPI', 'CARD'].includes(payment.method)) {
        if (payment.status !== 'PAID') {
          return res.status(400).json({
            success: false,
            error: {
              code: ERROR_CODES.BOOKING_INVALID_STATUS,
              message: 'Electronic payment has not been paid'
            }
          });
        }

        booking.status = 'PICKED_UP';
        await booking.save();
        return res.status(200).json({
          success: true,
          data: booking
        });
      }

      // CASH_ON_PICKUP: Execute documented cash collection handover sequence
      if (payment.method === 'CASH_ON_PICKUP') {
        if (payment.status !== 'PENDING') {
          return res.status(400).json({
            success: false,
            error: {
              code: ERROR_CODES.PAYMENT_ALREADY_PROCESSED,
              message: 'Cash payment already collected'
            }
          });
        }

        await withTransaction(async (session) => {
          payment.status = 'PAID';
          payment.paidAt = new Date();
          await payment.save(session ? { session } : {});

          await bookingService.markBookingPickedUp(booking._id, session ? { session } : {});
        });

        const updatedBooking = await Booking.findById(booking._id);
        return res.status(200).json({
          success: true,
          data: updatedBooking
        });
      }
    }

    // Any other transition is unsupported
    return res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.BOOKING_INVALID_STATUS,
        message: 'Invalid booking status transition'
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus
};
