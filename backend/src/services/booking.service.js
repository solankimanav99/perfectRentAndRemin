const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Clothing = require('../models/Clothing');
const { ERROR_CODES } = require('../utils/constants');
const { normalizeUtcDate, calculateRentalDuration } = require('../utils/calculateRental');
const { supportsTransactions, withTransaction } = require('../utils/transactionHelper');

// Dynamic resolver for Payment model to avoid circular dependency
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
 * Reservable statuses that hold clothing inventory per BR-030
 */
const RESERVABLE_STATUSES = ['PENDING', 'CONFIRMED', 'PICKED_UP', 'OVERDUE'];

/**
 * Calculates reserved quantity for a clothing item across an overlapping date range.
 * Overlap rule (BR-011): existingStart < requestedEnd AND existingEnd > requestedStart
 *
 * @param {ObjectId} clothingId
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {ClientSession} [session]
 * @returns {Promise<number>}
 */
const calculateReservedQuantity = async (clothingId, startDate, endDate, session = null) => {
  const query = {
    clothingId,
    status: { $in: RESERVABLE_STATUSES },
    rentalStartDate: { $lt: endDate },
    returnDate: { $gt: startDate }
  };

  const options = session ? { session } : {};
  const activeBookings = await Booking.find(query, 'quantity', options);

  return activeBookings.reduce((sum, b) => sum + (b.quantity || 0), 0);
};

/**
 * Creates a new booking with bounded retry concurrency protocol (BR-041).
 */
const createBooking = async ({ customerId, clothingId, rentalStartDate, returnDate, quantity }) => {
  // 1. UTC Date normalization (BR-042)
  const normStart = normalizeUtcDate(rentalStartDate);
  const normEnd = normalizeUtcDate(returnDate);

  // Validate dates: start must be earlier than return date (BR-005)
  if (normStart.getTime() >= normEnd.getTime()) {
    const error = new Error('Rental start date must be earlier than return date');
    error.statusCode = 400;
    error.code = ERROR_CODES.BOOKING_DATE_INVALID;
    throw error;
  }

  // Reject past rental start dates (BR-005)
  const todayUtc = normalizeUtcDate(new Date());
  if (normStart.getTime() < todayUtc.getTime()) {
    const error = new Error('Rental start date cannot be in the past');
    error.statusCode = 400;
    error.code = ERROR_CODES.BOOKING_DATE_INVALID;
    throw error;
  }

  const rentalDuration = calculateRentalDuration(normStart, normEnd);
  if (rentalDuration < 1) {
    const error = new Error('Rental duration must be at least 1 day');
    error.statusCode = 400;
    error.code = ERROR_CODES.BOOKING_DATE_INVALID;
    throw error;
  }

  // 2. Fetch clothing item
  const clothing = await Clothing.findById(clothingId);
  if (!clothing) {
    const error = new Error('Clothing item not found');
    error.statusCode = 404;
    error.code = ERROR_CODES.CLOTHING_NOT_FOUND;
    throw error;
  }

  // Check general availability (BR-012)
  if (clothing.availabilityStatus !== 'AVAILABLE' || clothing.quantity <= 0) {
    const error = new Error('Clothing item is unavailable for booking');
    error.statusCode = 400;
    error.code = ERROR_CODES.CLOTHING_UNAVAILABLE;
    throw error;
  }

  // Check requested quantity against total physical quantity (BR-012)
  if (quantity > clothing.quantity) {
    const error = new Error('Requested quantity exceeds available clothing quantity');
    error.statusCode = 400;
    error.code = ERROR_CODES.BOOKING_QUANTITY_INVALID;
    throw error;
  }

  // Pricing calculations (BR-007, BR-008, BR-009)
  const rentalAmount = clothing.rentalPrice * quantity * rentalDuration;
  const securityDeposit = clothing.securityDeposit; // flat, not multiplied by quantity
  const totalAmount = rentalAmount + securityDeposit;

  // 3. Concurrency Protocol: Transaction with Conflict Generation (BR-041)
  const isReplicaSet = supportsTransactions();
  const MAX_RETRIES = isReplicaSet ? 5 : 1;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;

    try {
      return await withTransaction(async (session) => {
        // Step 3a: Conflict Generation via conditional write / version bump
        const currentClothing = session
          ? await Clothing.findById(clothingId).session(session)
          : await Clothing.findById(clothingId);

        if (!currentClothing || currentClothing.availabilityStatus !== 'AVAILABLE') {
          const err = new Error('Clothing unavailable');
          err.statusCode = 400;
          err.code = ERROR_CODES.CLOTHING_UNAVAILABLE;
          throw err;
        }

        if (session) {
          // Bump version or touch document inside transaction to serialize concurrent reservations
          const updateRes = await Clothing.updateOne(
            { _id: clothingId, __v: currentClothing.__v },
            { $inc: { __v: 1 } },
            { session }
          );

          if (updateRes.matchedCount === 0) {
            const conflictErr = new Error('Optimistic concurrency conflict');
            conflictErr.code = 112; // WriteConflict
            throw conflictErr;
          }
        }

        // Step 3b: Availability Check using fresh data
        const reservedQuantity = await calculateReservedQuantity(clothingId, normStart, normEnd, session);
        const availableQuantity = currentClothing.quantity - reservedQuantity;

        if (availableQuantity < quantity) {
          const overlapErr = new Error('Insufficient inventory for the requested dates.');
          overlapErr.statusCode = 409;
          overlapErr.code = ERROR_CODES.BOOKING_OVERLAP;
          throw overlapErr;
        }

        // Step 3c: Validation & Insertion
        const booking = new Booking({
          customerId,
          clothingId,
          rentalStartDate: normStart,
          returnDate: normEnd,
          quantity,
          rentalDuration,
          rentalAmount,
          securityDeposit,
          totalAmount,
          status: 'PENDING'
        });

        await booking.save(session ? { session } : {});
        return booking;
      });
    } catch (err) {
      // If business overlap or unavailable, fail immediately (do not retry)
      if (err.code === ERROR_CODES.BOOKING_OVERLAP || err.code === ERROR_CODES.CLOTHING_UNAVAILABLE) {
        throw err;
      }

      // Check if transient transaction write conflict
      const isTransient =
        err.hasErrorLabel &&
        (err.hasErrorLabel('TransientTransactionError') || err.hasErrorLabel('UnknownTransactionCommitResult'));

      if (!isTransient && err.code !== 112 && err.code !== 11000) {
        throw err;
      }

      if (attempt >= MAX_RETRIES) {
        const exhaustedErr = new Error('Transaction retries exhausted due to database conflicts');
        exhaustedErr.statusCode = 500;
        exhaustedErr.code = ERROR_CODES.DATABASE_ERROR;
        throw exhaustedErr;
      }
    }
  }
};

/**
 * Cancels a booking (PUT /bookings/:id/cancel).
 * Allowed from PENDING or CONFIRMED.
 */
const cancelBooking = async ({ bookingId, user }) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    error.code = ERROR_CODES.BOOKING_NOT_FOUND;
    throw error;
  }

  // Authorization check: customer owns booking or user is ADMIN
  if (user.role !== 'ADMIN' && booking.customerId.toString() !== user._id.toString()) {
    const error = new Error('Access forbidden');
    error.statusCode = 403;
    error.code = ERROR_CODES.FORBIDDEN;
    throw error;
  }

  // Allowed only from PENDING or CONFIRMED (BR-014, BR-036)
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    const error = new Error('Booking is not in a cancellable status');
    error.statusCode = 400;
    error.code = ERROR_CODES.BOOKING_NOT_CANCELLABLE;
    throw error;
  }

  booking.status = 'CANCELLED';
  await booking.save();

  return booking;
};

// ==========================================
// SHARED SERVICE METHODS (Section 22 Contract)
// ==========================================

/**
 * Confirms a booking atomically.
 * Permitted transition: PENDING -> CONFIRMED
 *
 * @param {string|ObjectId} bookingId
 * @param {{ session?: ClientSession }} [options]
 */
const confirmBooking = async (bookingId, options = {}) => {
  return withTransaction(async (activeSession) => {
    const query = Booking.findById(bookingId);
    const booking = activeSession ? await query.session(activeSession) : await query;
    if (!booking) {
      const error = new Error('Booking not found');
      error.statusCode = 404;
      error.code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw error;
    }

    if (booking.status !== 'PENDING') {
      const error = new Error('Invalid booking status transition');
      error.statusCode = 400;
      error.code = ERROR_CODES.BOOKING_INVALID_STATUS;
      throw error;
    }

    booking.status = 'CONFIRMED';
    await booking.save(activeSession ? { session: activeSession } : {});
    return booking;
  }, options);
};

/**
 * Transitions booking to PICKED_UP atomically during physical handover.
 * Permitted transition: CONFIRMED -> PICKED_UP
 *
 * @param {string|ObjectId} bookingId
 * @param {{ session?: ClientSession }} [options]
 */
const markBookingPickedUp = async (bookingId, options = {}) => {
  return withTransaction(async (activeSession) => {
    const query = Booking.findById(bookingId);
    const booking = activeSession ? await query.session(activeSession) : await query;
    if (!booking) {
      const error = new Error('Booking not found');
      error.statusCode = 404;
      error.code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw error;
    }

    if (booking.status !== 'CONFIRMED') {
      const error = new Error('Invalid booking status transition');
      error.statusCode = 400;
      error.code = ERROR_CODES.BOOKING_INVALID_STATUS;
      throw error;
    }

    booking.status = 'PICKED_UP';
    await booking.save(activeSession ? { session: activeSession } : {});
    return booking;
  }, options);
};

/**
 * Transitions booking to RETURNED atomically upon return creation.
 * Permitted transitions: PICKED_UP or OVERDUE -> RETURNED
 *
 * @param {string|ObjectId} bookingId
 * @param {{ session?: ClientSession }} [options]
 */
const markBookingReturned = async (bookingId, options = {}) => {
  return withTransaction(async (activeSession) => {
    const query = Booking.findById(bookingId);
    const booking = activeSession ? await query.session(activeSession) : await query;
    if (!booking) {
      const error = new Error('Booking not found');
      error.statusCode = 404;
      error.code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw error;
    }

    if (!['PICKED_UP', 'OVERDUE'].includes(booking.status)) {
      const error = new Error('Invalid booking status transition');
      error.statusCode = 400;
      error.code = ERROR_CODES.BOOKING_INVALID_STATUS;
      throw error;
    }

    booking.status = 'RETURNED';
    await booking.save(activeSession ? { session: activeSession } : {});
    return booking;
  }, options);
};

/**
 * Transitions booking to COMPLETED atomically upon return settlement.
 * Permitted transitions: RETURNED -> COMPLETED
 *
 * @param {string|ObjectId} bookingId
 * @param {{ session?: ClientSession }} [options]
 */
const settleBooking = async (bookingId, options = {}) => {
  return withTransaction(async (activeSession) => {
    const query = Booking.findById(bookingId);
    const booking = activeSession ? await query.session(activeSession) : await query;
    if (!booking) {
      const error = new Error('Booking not found');
      error.statusCode = 404;
      error.code = ERROR_CODES.BOOKING_NOT_FOUND;
      throw error;
    }

    if (booking.status === 'COMPLETED') {
      const error = new Error('Settlement already completed for this booking');
      error.statusCode = 409;
      error.code = ERROR_CODES.SETTLEMENT_ALREADY_COMPLETED || 'SETTLEMENT_ALREADY_COMPLETED';
      throw error;
    }

    if (booking.status !== 'RETURNED') {
      const error = new Error('Invalid booking status transition');
      error.statusCode = 400;
      error.code = ERROR_CODES.BOOKING_INVALID_STATUS;
      throw error;
    }

    booking.status = 'COMPLETED';
    await booking.save(activeSession ? { session: activeSession } : {});
    return booking;
  }, options);
};

module.exports = {
  createBooking,
  cancelBooking,
  calculateReservedQuantity,
  confirmBooking,
  markBookingPickedUp,
  markBookingReturned,
  settleBooking
};
