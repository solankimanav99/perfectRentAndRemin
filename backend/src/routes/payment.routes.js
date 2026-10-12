const express = require('express');
const { protect, admin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  createPaymentSchema,
  refundPaymentSchema
} = require('../validators/payment.validator');
const {
  createPayment,
  getPayments,
  getPaymentById,
  getPaymentByBookingId,
  refundPayment
} = require('../controllers/payment.controller');

const router = express.Router();

router.post('/', protect, validate(createPaymentSchema), createPayment);
router.get('/', protect, getPayments);
router.get('/:id', protect, getPaymentById);
router.post('/:id/refund', protect, admin, validate(refundPaymentSchema), refundPayment);

module.exports = router;
module.exports.getPaymentByBookingId = getPaymentByBookingId;
