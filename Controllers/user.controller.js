const mongoose = require('mongoose');
const User=require('../Models/User.model');
const httpStatusText = require('../httpStatusText');
const asyncwrapper = require('../asyncwrapper');
const appError = require('../appError');
const userRoles=require('../user.roles');
const bcrypt=require('bcryptjs');


/* ===========================
   CLIENT FUNCTIONS
=========================== */


//User Profile
const getMyProfile = asyncwrapper(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-password -__v');

// User Profile
// const getMyProfile = asyncwrapper(async (req, res, next) => {
//   const user = await User.findById(req.user.id).select('-password -__v');

//   if (!user) {
//     return next(
//       AppError.create('User not found', 404, httpStatusText.FAIL)
//     );
//   }

//   res.status(200).json({
//     status: httpStatusText.SUCCESS,
//     data: user,
//   });
// });


const getMyProfile = async (req, res) => {
  try {
    console.log("USER:", req.user);

    const user = await User.findById(req.user.id).select('-password -__v');

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found"
      });
    }

    res.status(200).json({
      status: "success",
      data: user,
    });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};

//Update User Profile
const updateMyProfile = asyncwrapper(async (req, res, next) => {
  const { firstName, lastName, phoneNumber, city, location } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { firstName, lastName, phoneNumber, city, location },
    { new: true, runValidators: true }
  ).select('-password');

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: user,
  });
});

//Change Password
const changePassword = asyncwrapper(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  if (!user || !(await user.comparePassword(currentPassword))) {
    return next(
      appError.create('Current password is incorrect', 400, httpStatusText.FAIL)
    );
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


const getAllUsers = asyncwrapper(async (req, res, next) => {
  const users = await User.find({}, { password: false, __v: false });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    results: users.length,
    data: users
  });
});

const getUserById = asyncwrapper(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return next(
      appError.create('User not found', 404, httpStatusText.FAIL)
    );
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: user,
  });
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  changePassword,
  getAllUsers,
  getUserById,
};