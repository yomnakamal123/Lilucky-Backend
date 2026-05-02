// const mongoose = require("mongoose");

// const orderSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true
//   },

//   items: [
//     {
//       productId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Product"
//       },
//       name: String,
//       price: Number,   
//       quantity: Number
//     }
//   ],

//   subtotal: Number,
//   deliveryPrice: Number,
//   totalAmount: Number,

//   paymentMethod: {
//     type: String,
//     enum: ["cash", "card"],
//     default: "cash"
//   },

//   orderStatus: {
//     type: String,
//     enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
//     default: "pending"
//   },

//   deliveryAddress: {
//     governorate: String,
//     city: String,
//     street: String,
//     phoneNumber: String
//   }
// }, { timestamps: true });

// module.exports = mongoose.model('Order', orderSchema);


const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },

      name: String,
      price: Number,
      quantity: Number,

      // 👇 مهمين جداً
      color: String,

      size: String,

      // اختياري لو عايز تربطها بالـ variant نفسه
      variantId: mongoose.Schema.Types.ObjectId
    }
  ],

  subtotal: Number,
  deliveryPrice: Number,
  totalAmount: Number,

  paymentMethod: {
    type: String,
    enum: ["cash", "card"],
    default: "cash"
  },

  orderStatus: {
    type: String,
    enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
    default: "pending"
  },

  deliveryAddress: {
    governorate: String,
    city: String,
    street: String,
    phoneNumber: String
  }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);