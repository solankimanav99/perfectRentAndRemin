const express = require('express');
const { protect, admin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  createReturnSchema,
  settleReturnSchema
} = require('../validators/return.validator');
const {
  processReturn,
  getReturns,
  getReturnById,
  settleReturn
} = require('../controllers/return.controller');

const router = express.Router();

router.post('/', protect, admin, validate(createReturnSchema), processReturn);
router.get('/', protect, getReturns);
router.get('/:id', protect, getReturnById);
router.post('/:id/settle', protect, admin, validate(settleReturnSchema), settleReturn);

module.exports = router;
