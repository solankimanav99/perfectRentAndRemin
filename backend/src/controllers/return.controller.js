const mongoose = require('mongoose');
const Return = require('../models/Return');
const { ERROR_CODES } = require('../utils/constants');
const calculateFine = require('../utils/calculateFine');
const { supportsTransactions, withTransaction } = require('../utils/transactionHelper');

const getBookingModel = () => {
  try {
    return require('../models/Booking');
  } catch (err) {
    if (mongoose.models.Booking) {
      return mongoose.models.Booking;
    }
    return null;
  }
};

const getBookingService = () => {
  try {
    return require('./booking.service');
  } catch (err) {
    return null;
  }
};

/**
 * Mask return record for non-admin customer when settled is false.
 * Per docs: damageCharge and depositRefunded must be null until settled is true.
 */
const formatReturnResponse = (ret, isAdmin = false) => {
  const json = ret.toJSON ? ret.toJSON() : { ...ret };
  if (!isAdmin && !json.settled) {
    json.damageCharge = null;
    json.depositRefunded = null;
  }
  return json;
};

/**
 * POST /api/returns (ADMIN only)
 * Creates physical return record and transitions booking to RETURNED.
 */
const processReturn = async (req, res, next) => {
  try {
    const { bookingId, actualReturnDate, condition } = req.body;
    const Booking = getBookingModel();

    if (!Booking) {
      return res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_SERVER_ERROR,
          message: 'Booking service unavailable'
        }
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.BOOKING_NOT_FOUND,
          message: 'Booking not found'
        }
      });
    }

    // Duplicate check: check if a return record already exists
    const existingReturn = await Return.findOne({ bookingId });
    if (existingReturn) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.RETURN_ALREADY_COMPLETED,
          message: 'Return already processed for this booking'
        }
      });
    }

    // Eligibility check: booking must be in PICKED_UP or OVERDUE
    if (!['PICKED_UP', 'OVERDUE'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.RETURN_INVALID_BOOKING,
          message: 'Booking is not eligible for return'
        }
      });
    }

    // Date validation: actualReturnDate cannot precede booking.rentalStartDate
    const actDate = new Date(`${actualReturnDate}T00:00:00.000Z`);
    const rentStart = new Date(booking.rentalStartDate);
    const rentStartUtc = new Date(Date.UTC(rentStart.getUTCFullYear(), rentStart.getUTCMonth(), rentStart.getUTCDate()));

    if (actDate < rentStartUtc) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.RETURN_INVALID_DATE,
          message: 'Actual return date cannot precede rental start date'
        }
      });
    }

    // Compute late days and fine
    const { lateDays, fine } = calculateFine(booking.returnDate, actDate);

    // Determine initial status: DAMAGED, LATE, or RETURNED
    let returnStatus = 'RETURNED';
    if (condition === 'DAMAGED') {
      returnStatus = 'DAMAGED';
    } else if (lateDays > 0) {
      returnStatus = 'LATE';
    }

    // Atomically save Return and mark booking returned
    let createdReturn;
    try {
      await withTransaction(async (session) => {
        createdReturn = new Return({
          bookingId: booking._id,
          clothingId: booking.clothingId,
          customerId: booking.customerId,
          expectedReturnDate: booking.returnDate,
          actualReturnDate: actDate,
          lateDays,
          fine,
          condition,
          status: returnStatus,
          damageCharge: 0,
          depositRefunded: 0,
          finePaid: false,
          settled: false
        });

        await createdReturn.save(session ? { session } : {});

        const bookingService = getBookingService();
        if (bookingService && typeof bookingService.markBookingReturned === 'function') {
          await bookingService.markBookingReturned(booking._id, session ? { session } : {});
        } else {
          booking.status = 'RETURNED';
          await booking.save(session ? { session } : {});
        }
      });
    } catch (err) {
      if (!supportsTransactions() && createdReturn?._id) {
        await Return.deleteOne({ _id: createdReturn._id }).catch(() => {});
      }
      if (err.code === 11000) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.RETURN_ALREADY_COMPLETED,
            message: 'Return already processed for this booking'
          }
        });
      }
      throw err;
    }

    return res.status(201).json({
      success: true,
      message: 'Return processed successfully.',
      data: {
        id: createdReturn._id.toString(),
        bookingId: createdReturn.bookingId.toString(),
        expectedReturnDate: createdReturn.expectedReturnDate.toISOString(),
        actualReturnDate: createdReturn.actualReturnDate.toISOString(),
        lateDays: createdReturn.lateDays,
        fine: createdReturn.fine,
        condition: createdReturn.condition,
        status: createdReturn.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/returns
 */
const getReturns = async (req, res, next) => {
  try {
    const query = {};
    const isAdmin = req.user.role === 'ADMIN';

    if (!isAdmin) {
      query.customerId = req.user._id;
    }

    const returns = await Return.find(query).sort({ createdAt: -1 });
    const formatted = returns.map((r) => formatReturnResponse(r, isAdmin));

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/returns/:id
 */
const getReturnById = async (req, res, next) => {
  try {
    const returnRecord = await Return.findById(req.params.id);

    if (!returnRecord) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.RETURN_NOT_FOUND,
          message: 'Return record not found'
        }
      });
    }

    const isAdmin = req.user.role === 'ADMIN';
    if (!isAdmin && returnRecord.customerId.toString() !== req.user._id.toString()) {
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
      data: formatReturnResponse(returnRecord, isAdmin)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/returns/:id/settle (ADMIN only)
 * Settles fine and deposit refund, transitioning booking to COMPLETED.
 */
const settleReturn = async (req, res, next) => {
  try {
    const { damageCharge = 0 } = req.body;
    const Booking = getBookingModel();

    const returnRecord = await Return.findById(req.params.id);
    if (!returnRecord) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.RETURN_NOT_FOUND,
          message: 'Return record not found'
        }
      });
    }

    // Repeated settlement check (strictly idempotent HTTP 409 SETTLEMENT_ALREADY_COMPLETED)
    if (returnRecord.settled) {
      return res.status(409).json({
        success: false,
        error: {
          code: ERROR_CODES.SETTLEMENT_ALREADY_COMPLETED,
          message: 'Settlement already completed for this return record.'
        }
      });
    }

    let booking = null;
    if (Booking) {
      booking = await Booking.findById(returnRecord.bookingId);
    }

    const securityDeposit = booking ? booking.securityDeposit : 0;
    if (damageCharge > securityDeposit) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Damage charge cannot exceed booking security deposit'
        }
      });
    }

    const depositRefunded = Math.max(0, securityDeposit - damageCharge);

    // Atomically settle return and transition booking to COMPLETED
    await withTransaction(async (session) => {
      returnRecord.damageCharge = damageCharge;
      returnRecord.depositRefunded = depositRefunded;
      returnRecord.finePaid = true;
      returnRecord.settled = true;
      returnRecord.settledAt = new Date();

      await returnRecord.save(session ? { session } : {});

      const bookingService = getBookingService();
      if (bookingService && typeof bookingService.settleBooking === 'function') {
        await bookingService.settleBooking(returnRecord.bookingId, session ? { session } : {});
      } else if (booking) {
        booking.status = 'COMPLETED';
        await booking.save(session ? { session } : {});
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Return settled successfully.',
      data: {
        id: returnRecord._id.toString(),
        bookingId: returnRecord.bookingId.toString(),
        lateDays: returnRecord.lateDays,
        fine: returnRecord.fine,
        depositRefunded: returnRecord.depositRefunded,
        finePaid: returnRecord.finePaid,
        settled: returnRecord.settled,
        settledAt: returnRecord.settledAt.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processReturn,
  getReturns,
  getReturnById,
  settleReturn
};
