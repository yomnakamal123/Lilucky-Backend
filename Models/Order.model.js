const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  items: {
    type: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      }
    }],
    required: true,
    validate: [arr => arr.length > 0, 'Order must have at least one item']
  },

  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },

  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },

  deliveryAddress: {
    city: { type: String, required: true },
    location: { type: String, required: true },
    phoneNumber: { type: String, required: true }
  }

}, 
{ timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
