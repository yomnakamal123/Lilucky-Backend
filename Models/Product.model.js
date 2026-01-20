const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    sizes: [
      {
        type: String,
        enum: ['1Y', '2Y', '3Y', '4Y', '5Y']
      }
    ],
    colors: {
      type: [String],
      required: true
    },
    stock: {
      type: Number,
      required: true,
      min: 0
    },
  category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
  },
    images: [String],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

productSchema.index({ name: 1, category: 1 });

module.exports = mongoose.model('Product', productSchema);
