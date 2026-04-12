const mongoose = require('mongoose');
const User=require('../Models/User.model');
const httpStatusText = require('../httpStatusText');
const asyncwrapper = require('../asyncwrapper');
const appError = require('../appError');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const generateJWT=require('../generateJWT');
const userRoles=require('../user.roles');
const crypto = require('crypto'); // must be at the top
const resetToken = crypto.randomBytes(32).toString('hex');
const sendEmail = require('../email');


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
    confirmPassword,  // <-- add this
    phoneNumber,
    governorate,
    city,
    address,
    role
  } = req.body;

  if (password !== confirmPassword) {
    return next(appError.create('Passwords do not match', 400, httpStatusText.FAIL));
  }

  // 2️⃣ Check if user already exists
  const oldUser = await User.findOne({ email });
  if (oldUser) {
    return next(appError.create('User already exists', 400, httpStatusText.FAIL));
  }

  // 3️⃣ Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 4️⃣ Set role safely
  const allowedRole = role === userRoles.ADMIN ? userRoles.ADMIN : userRoles.CLIENT;

  // 5️⃣ Create new user
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

  // 6️⃣ Generate JWT
  const token = generateJWT({
    id: newUser._id,
    email: newUser.email,
    role: newUser.role
  });

  // 7️⃣ Return response
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



const forgotPassword = asyncwrapper(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next(appError.create('No user found with this email', 404));
  const otp = Math.floor(100000 + Math.random() * 900000);
  user.otp = otp;
  user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();
  const subject = "Your OTP Code";
  const text = `Your OTP code is ${otp}. It expires in 10 minutes.`;
  const html = `<p>Your OTP code is <b>${otp}</b>. It expires in 10 minutes.</p>`;

  await sendEmail({ to: email, subject, text, html });

  res.status(200).json({
    status: 'success',
    message: 'OTP sent to your email'
  });
});



const resetPasswordWithOTP = asyncwrapper(async (req, res, next) => {
  const { email, otp, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return next(appError.create('Passwords do not match', 400));
  }

  const user = await User.findOne({
    email,
    otp,
    otpExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(appError.create('Invalid or expired OTP', 400));
  }

  // Update password
  user.password = await bcrypt.hash(password, 10);
  user.otp = undefined;
  user.otpExpires = undefined;

  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password has been reset successfully'
  });
});




module.exports={
   // getallusers,
    register,
    login,
    forgotPassword,
    resetPasswordWithOTP
}