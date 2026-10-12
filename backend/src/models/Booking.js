const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    clothingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clothing',
      required: true,
      index: true
    },
    rentalStartDate: {
      type: Date,
      required: true,
      index: true
    },
    returnDate: {
      type: Date,
      required: true,
      index: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    rentalDuration: {
      type: Number,
      required: true,
      min: 1
    },
    rentalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    securityDeposit: {
      type: Number,
      required: true,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      required: true,
      enum: [
        'PENDING',
        'CONFIRMED',
        'PICKED_UP',
        'RETURNED',
        'COMPLETED',
        'CANCELLED',
        'OVERDUE'
      ],
      default: 'PENDING',
      index: true
    }
  },
  {
    timestamps: true
  }
);

bookingSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
