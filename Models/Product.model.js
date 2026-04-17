const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    description: { type: String, required: true, trim: true },

    price: { type: Number, required: true, min: 0 },

    gender: {
      type: String,
      enum: ["boys", "girls"],
      required: true
    },
    stock: { type: Number, required: true, min: 0 },

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },

    material: { type: String, required: true, trim: true },

    variants: [
      {
        color: { type: String, required: true },
        sizes: [{ type: String, enum: ['1Y', '2Y', '3Y', '4Y', '5Y', '6Y', '7Y', '8Y'] }],
        images: [String]
      }
    ],

    isActive: { type: Boolean, default: true },

    like: { type: Boolean, default: false },

    main_price: { type: Number, required: true }
  },
  { timestamps: true } // <-- options go here, not inside fields
);

productSchema.index({ name: 1, category: 1 });

module.exports = mongoose.model('Product', productSchema);
