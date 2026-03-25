const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const userRoles = require('../user.roles');
const { toNumber } = require('lodash');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Field must be a valid email']
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false // 🔐 IMPORTANT
    },
    phoneNumber: {
      type: String,
      required: true,
      match: [/^\+?\d{10,15}$/, 'Invalid phone number']
    },
    city: {
      type: String,
      required: true
    },
    governorate: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: Object.values(userRoles),
      default: userRoles.CLIENT
    },
    otp:Number,
    otpExpires: Date
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

