const mongoose = require('mongoose');

const clothingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  size: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  rentalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  securityDeposit: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value'
    }
  },
  image: {
    type: String,
    required: false
  },
  condition: {
    type: String,
    required: true,
    enum: ['EXCELLENT', 'GOOD', 'FAIR', 'MAINTENANCE']
  },
  availabilityStatus: {
    type: String,
    required: true,
    enum: ['AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      ret.id = ret._id.toString();
      
      // Support category population replacement
      if (ret.categoryId && typeof ret.categoryId === 'object' && ret.categoryId._id) {
        ret.category = ret.categoryId;
        ret.category.id = ret.category._id.toString();
        delete ret.category._id;
        delete ret.category.__v;
        delete ret.categoryId;
      }
      
      delete ret._id;
      delete ret.__v;
    }
  }
});

clothingSchema.index({ name: 1, size: 1, color: 1 });

module.exports = mongoose.model('Clothing', clothingSchema);
