const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const { ERROR_CODES } = require('../utils/constants');
const env = require('../config/env');
const { supportsTransactions, withTransaction } = require('../utils/transactionHelper');

// Dynamically resolve Booking model and Booking service if provided by Developer A
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
 * Generates a unique transaction reference
 */
const generateTransactionReference = (method) => {
  const rand = Math.floor(100000 + Math.random() * 900000);
  if (method === 'CASH_ON_PICKUP') {
    return `SIM-COP-${rand}`;
  }
  return `SIM-${rand}`;
};

/**
 * Creates or initiates a payment for a booking.
 *
 * BR-037 & BR-044:
 * - Allowed only for booking owned by caller in status PENDING or CONFIRMED.
 * - Electronic (UPI, CARD): simulated success creates PAID record and atomically confirms booking.
 * - CASH_ON_PICKUP: creates PENDING payment record with paidAt: null without confirming booking.
 * - Duplicate payment: returns PAYMENT_ALREADY_PROCESSED.
 */
const createPayment = async ({ bookingId, method, simulateHeader, user }) => {
  const Booking = getBookingModel();
  if (!Booking) {
    const error = new Error('Booking service unavailable');
    error.statusCode = 500;
    error.code = ERROR_CODES.INTERNAL_SERVER_ERROR;
    throw error;
  }

  // 1. Fetch booking
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    error.code = ERROR_CODES.BOOKING_NOT_FOUND;
    throw error;
  }

  // 2. Authorization check: caller must own booking (unless user is ADMIN)
  if (user.role !== 'ADMIN' && booking.customerId.toString() !== user._id.toString()) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    error.code = ERROR_CODES.FORBIDDEN;
    throw error;
  }

  // 3. Status check: must be PENDING or CONFIRMED
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    const error = new Error('Booking status is not payable');
    error.statusCode = 400;
    error.code = ERROR_CODES.BOOKING_INVALID_STATUS;
    throw error;
  }

  // 4. Duplicate check: check if payment record already exists
  const existingPayment = await Payment.findOne({ bookingId });
  if (existingPayment) {
    const error = new Error('Payment already processed for this booking');
    error.statusCode = 400;
    error.code = ERROR_CODES.PAYMENT_ALREADY_PROCESSED;
    throw error;
  }

  // Check for simulated failure hook (development/test only)
  const isSimulatedFail =
    env.NODE_ENV !== 'production' &&
    (simulateHeader === 'FAILED' || method === 'TEST_FAIL');

  if (isSimulatedFail) {
    try {
      const failedPayment = await Payment.create({
        bookingId: booking._id,
        customerId: booking.customerId,
        amount: booking.totalAmount,
        method: method === 'TEST_FAIL' ? 'UPI' : method,
        status: 'FAILED',
        transactionReference: generateTransactionReference(method)
      });
      return {
        payment: failedPayment,
        message: 'Payment simulation failed.'
      };
    } catch (err) {
      if (err.code === 11000) {
        const error = new Error('Payment already processed for this booking');
        error.statusCode = 400;
        error.code = ERROR_CODES.PAYMENT_ALREADY_PROCESSED;
        throw error;
      }
      throw err;
    }
  }

  // 5. Handling by method
  if (method === 'CASH_ON_PICKUP') {
    try {
      const payment = await Payment.create({
        bookingId: booking._id,
        customerId: booking.customerId,
        amount: booking.totalAmount,
        method: 'CASH_ON_PICKUP',
        status: 'PENDING',
        paidAt: null,
        transactionReference: generateTransactionReference(method)
      });
      return {
        payment,
        message: 'Cash on pickup selected successfully.'
      };
    } catch (err) {
      if (err.code === 11000) {
        const error = new Error('Payment already processed for this booking');
        error.statusCode = 400;
        error.code = ERROR_CODES.PAYMENT_ALREADY_PROCESSED;
        throw error;
      }
      throw err;
    }
  }

  // 6. Electronic payments (UPI, CARD): Atomic transaction with confirmBooking
  let createdPaymentDoc = null;
  try {
    return await withTransaction(async (session) => {
      const payment = new Payment({
        bookingId: booking._id,
        customerId: booking.customerId,
        amount: booking.totalAmount,
        method,
        status: 'PAID',
        paidAt: new Date(),
        transactionReference: generateTransactionReference(method)
      });

      await payment.save(session ? { session } : {});
      createdPaymentDoc = payment;

      // Transition booking from PENDING to CONFIRMED
      if (booking.status === 'PENDING') {
        const bookingService = getBookingService();
        if (bookingService && typeof bookingService.confirmBooking === 'function') {
          await bookingService.confirmBooking(booking._id, session ? { session } : {});
        } else {
          // Fallback directly using model within transaction if service not injected
          booking.status = 'CONFIRMED';
          await booking.save(session ? { session } : {});
        }
      }

      return {
        payment,
        message: 'Payment processed successfully.'
      };
    });
  } catch (err) {
    // Standalone fallback: compensating rollback if transactions are not supported and booking confirmation failed
    if (!supportsTransactions() && createdPaymentDoc?._id) {
      await Payment.deleteOne({ _id: createdPaymentDoc._id }).catch(() => {});
    }
    if (err.code === 11000) {
      const error = new Error('Payment already processed for this booking');
      error.statusCode = 400;
      error.code = ERROR_CODES.PAYMENT_ALREADY_PROCESSED;
      throw error;
    }
    throw err;
  }
};

/**
 * Refunds a paid payment (ADMIN only).
 */
const refundPayment = async ({ paymentId, reason }) => {
  const Booking = getBookingModel();
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    const error = new Error('Payment not found');
    error.statusCode = 404;
    error.code = ERROR_CODES.PAYMENT_NOT_FOUND;
    throw error;
  }

  if (payment.status === 'REFUNDED') {
    const error = new Error('Payment already refunded');
    error.statusCode = 400;
    error.code = ERROR_CODES.PAYMENT_ALREADY_PROCESSED;
    throw error;
  }

  if (payment.status !== 'PAID') {
    const error = new Error('Payment is not in a refundable state');
    error.statusCode = 400;
    error.code = ERROR_CODES.PAYMENT_NOT_REFUNDABLE;
    throw error;
  }

  // Verify booking eligibility under BR-031
  if (Booking) {
    const booking = await Booking.findById(payment.bookingId);
    if (booking && booking.status !== 'CANCELLED') {
      const error = new Error('Booking is not eligible for refund');
      error.statusCode = 400;
      error.code = ERROR_CODES.PAYMENT_NOT_REFUNDABLE;
      throw error;
    }
  }

  payment.status = 'REFUNDED';
  payment.refundedAt = new Date();
  if (reason) {
    payment.refundReason = reason;
  }

  await payment.save();

  return payment;
};

module.exports = {
  createPayment,
  refundPayment
};
