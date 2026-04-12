const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    arName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    enName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
   categoryType: {
    type: String,
    enum: ["boys", "girls", "all"], 
    required: true
  },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
