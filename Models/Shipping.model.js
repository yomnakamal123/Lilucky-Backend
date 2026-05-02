const mongoose = require("mongoose");

const shippingSchema = new mongoose.Schema({
  governorate: {
    type: String,
    unique: true,
    required: true,
  },
  price: {
    type: Number,
    default: 0,
  },
  city: {
    type: String,
    default: "",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// 🔥 FIX HERE
module.exports =
  mongoose.models.Shipping || mongoose.model("Shipping", shippingSchema);