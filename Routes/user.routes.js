const express = require('express');
const router = express.Router();

const UserController = require('../Controllers/user.controller');
const verifyToken = require('../Middlewares/verifyToken');
const isAdmin = require('../Middlewares/isAdmin');

router.get('/profile', verifyToken, UserController.getMyProfile);
router.patch('/update', verifyToken, UserController.updateMyProfile);
router.patch('/change_password', verifyToken, UserController.changePassword);

// ✅ ADMIN ONLY ROUTES
router.get(
  '/users',
  verifyToken,
  isAdmin,
  UserController.getAllUsers
);

router.get(
  '/users/:id',
  verifyToken,
  isAdmin,
  UserController.getUserById
);


module.exports = router;
