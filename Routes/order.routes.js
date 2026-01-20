const express = require('express');
const router = express.Router();

const OrderController = require('../Controllers/order.controller');
const verifyToken = require('../Middlewares/verifyToken');
const allowedTo = require('../allowedTo');
const userRoles = require('../user.roles');
const isAdmin = require('../Middlewares/isAdmin');


// ================= CLIENT ROUTES =================

router.post('/',verifyToken, allowedTo(userRoles.CLIENT),OrderController.createOrder);

router.get('/my-orders',verifyToken,allowedTo(userRoles.CLIENT),OrderController.getMyOrders);


// // ================= ADMIN ROUTES =================

router.get('/all_orders',verifyToken,isAdmin,OrderController.getAllOrders);

router.patch('/:id/status',verifyToken,isAdmin,OrderController.updateOrderStatus);

module.exports = router;
