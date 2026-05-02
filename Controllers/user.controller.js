const mongoose = require('mongoose');
const User=require('../Models/User.model');
const httpStatusText = require('../httpStatusText');
const asyncwrapper = require('../asyncwrapper');
const appError = require('../appError');
const userRoles=require('../user.roles');
const bcrypt=require('bcryptjs');

const getMyProfile = asyncwrapper(async (req, res, next) => {
  const userId = req.user._id; // 🔥 توحيد

  const user = await User.findById(userId).select('-password -__v');

  if (!user) {
    return next(appError.create('User not found', 404));
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: user,
  });
});

// ✏️ Update My Profile
const updateMyProfile = asyncwrapper(async (req, res, next) => {
  const userId = req.user._id;

  const { firstName, lastName, phoneNumber, address } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return next(appError.create("User not found", 404));
  }

  // update basic fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phoneNumber) user.phoneNumber = phoneNumber;

  // update address (nested object)
  if (address) {
    user.address = {
      city: address.city || user.address?.city,
      governorate: address.governorate || user.address?.governorate,
      street: address.street || user.address?.street,
    };
  }

  await user.save();

  res.status(200).json({
    status: "success",
    data: user,
  });
});
const changePassword = asyncwrapper(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    return next(appError.create('User not found', 404));
  }

  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return next(appError.create('Current password is incorrect', 400));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: 'Password updated successfully',
  });
});

/* ===========================
   ADMIN FUNCTIONS
=========================== */

// 👥 Get All Users
const getAllUsers = asyncwrapper(async (req, res, next) => {
  const users = await User.find().select('-password -__v');

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    results: users.length,
    data: users,
  });
});

// 👤 Get User By ID
const getUserById = asyncwrapper(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password -__v');

  if (!user) {
    return next(appError.create('User not found', 404));
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: user,
  });
});

// ✏️ Update User (ADMIN)
const updateUser = asyncwrapper(async (req, res, next) => {
  const userId = req.params.id;

  // منع تعديل password من هنا
  delete req.body.password;

  const user = await User.findByIdAndUpdate(
    userId,
    req.body,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return next(appError.create('User not found', 404));
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: user,
  });
});

// 🗑️ Delete User
const deleteUser = asyncwrapper(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(appError.create('User not found', 404));
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: 'User deleted successfully',
  });
});

/* ===========================
   EXPORTS
=========================== */

module.exports = {
  getMyProfile,
  updateMyProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};