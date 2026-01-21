const mongoose = require('mongoose');
const User=require('../Models/User.model');
const httpStatusText = require('../httpStatusText');
const asyncwrapper = require('../asyncwrapper');
const appError = require('../appError');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const generateJWT=require('../generateJWT');
const userRoles=require('../user.roles');


// const getallusers=asyncwrapper(async (req, res) => {
//   console.log(req.headers);

//   const query = req.query;
//   const limit = parseInt(query.limit) || 10;
//   const page = parseInt(query.page) || 1;
//   const skip = (page - 1) * limit;

//   const users = await User.find({}, { __v: false,'password':false }).limit(limit).skip(skip);
//   res.status(200).json({ status: httpStatusText.SUCCESS, data: { users } });
// });

const register = asyncwrapper(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    password,
    phoneNumber,
    governorate,
    city,
    address,
    role
  } = req.body;

  const oldUser = await User.findOne({ email });
  if (oldUser) {
    return next(appError.create('User already exists', 400, httpStatusText.FAIL));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  //  Only allow admin if explicitly requested AND valid
  const allowedRole =
    role === userRoles.ADMIN ? userRoles.ADMIN : userRoles.CLIENT;

  const newUser = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    phoneNumber,
    city,
    governorate,
    address,
    role: allowedRole
  });

  const token = generateJWT({
    id: newUser._id,
    email: newUser.email,
    role: newUser.role
  });

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: {
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role
      }
    }
  });
});


const login = asyncwrapper(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(
      appError.create('Invalid email or password', 401, httpStatusText.FAIL)
    );
  }

  // 🔐 CREATE TOKEN
  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: '1h' }
  );

  // ❗ REMOVE PASSWORD
  user.password = undefined;

  // ✅ RETURN TOKEN
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      token,
      user
    }
  });
});





module.exports={
   // getallusers,
    register,
    login
}