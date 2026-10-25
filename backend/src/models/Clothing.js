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
    required: false,
    default: ''
  },
  images: {
    type: [String],
    default: []
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
      
      // Ensure images array is always populated consistently in API responses
      if (!Array.isArray(ret.images) || ret.images.length === 0) {
        ret.images = ret.image ? [ret.image] : [];
      }

      delete ret._id;
      delete ret.__v;
    }
  }
});

clothingSchema.pre('validate', function (next) {
  // Normalize images array: trim strings, remove blanks, deduplicate preserving order
  if (Array.isArray(this.images)) {
    const cleanList = [];
    for (const img of this.images) {
      if (typeof img === 'string') {
        const trimmed = img.trim();
        if (trimmed && !cleanList.includes(trimmed)) {
          cleanList.push(trimmed);
        }
      }
    }
    this.images = cleanList;
  } else if (this.images) {
    this.images = [];
  }

  // If images are provided, keep primary image in sync with images[0]
  if (this.images && this.images.length > 0) {
    if (!this.image || !this.images.includes(this.image)) {
      this.image = this.images[0];
    }
  } else if (this.image && typeof this.image === 'string' && this.image.trim()) {
    // If legacy single image is provided without images array
    this.image = this.image.trim();
    this.images = [this.image];
  } else {
    this.image = '';
    this.images = [];
  }

  next();
});

clothingSchema.index({ name: 1, size: 1, color: 1 });

module.exports = mongoose.model('Clothing', clothingSchema);
