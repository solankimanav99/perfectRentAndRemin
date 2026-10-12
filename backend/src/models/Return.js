const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
      index: true
    },
    clothingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clothing',
      required: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    expectedReturnDate: {
      type: Date,
      required: true
    },
    actualReturnDate: {
      type: Date,
      required: true
    },
    lateDays: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    fine: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    condition: {
      type: String,
      required: true,
      enum: ['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED']
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'RETURNED', 'LATE', 'DAMAGED'],
      index: true
    },
    damageCharge: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    depositRefunded: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    finePaid: {
      type: Boolean,
      required: true,
      default: false
    },
    settled: {
      type: Boolean,
      required: true,
      default: false
    },
    settledAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

returnSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Return = mongoose.model('Return', returnSchema);

module.exports = Return;
