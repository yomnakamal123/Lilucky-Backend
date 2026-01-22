const express = require('express');
const router = express.Router();
const userController = require('../Controllers/auth.controller');
const verifyToken=require('../Middlewares/verifyToken');   
// const multer=require('multer');
const appError = require('../appError');

                            

// router.get('/users',verifyToken, userController.getallusers);

router.post('/register',userController.register);

router.post('/login', userController.login);

router.post('/forgot-password', userController.forgotPassword);

router.post('/reset-password-otp', userController.resetPasswordWithOTP);

module.exports = router;
