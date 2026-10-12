const Payment = require('../models/Payment');
const paymentService = require('../services/payment.service');
const { ERROR_CODES } = require('../utils/constants');

/**
 * POST /api/payments
 */
const createPayment = async (req, res, next) => {
  try {
    const { bookingId, method } = req.body;
    const simulateHeader = req.headers['x-simulate-payment'];

    const { payment, message } = await paymentService.createPayment({
      bookingId,
      method,
      simulateHeader,
      user: req.user
    });

    return res.status(201).json({
      success: true,
      message,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/payments
 */
const getPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (req.user.role !== 'ADMIN') {
      query.customerId = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/payments/:id
 */
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.PAYMENT_NOT_FOUND,
          message: 'Payment not found'
        }
      });
    }

    if (req.user.role !== 'ADMIN' && payment.customerId.toString() !== req.user._id.toString()) {
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
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/:bookingId/payment
 */
const getPaymentByBookingId = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ bookingId: req.params.bookingId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.PAYMENT_NOT_FOUND,
          message: 'Payment not found for this booking'
        }
      });
    }

    if (req.user.role !== 'ADMIN' && payment.customerId.toString() !== req.user._id.toString()) {
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
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/:id/refund (ADMIN only)
 */
const refundPayment = async (req, res, next) => {
  try {
    const { reason } = req.body || {};
    const payment = await paymentService.refundPayment({
      paymentId: req.params.id,
      reason
    });

    return res.status(200).json({
      success: true,
      message: 'Payment refunded successfully.',
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  getPayments,
  getPaymentById,
  getPaymentByBookingId,
  refundPayment
};
