const express = require('express');
const router = express.Router();
const verifyToken = require('../Middlewares/verifyToken');
const cartcontroller=require('../Controllers/cart.controller')
router.use(verifyToken);

router.post('/add-to-cart',verifyToken,cartcontroller.addToCart);
router.get('/cart',verifyToken,cartcontroller.getCart);
router.delete('/clear-cart',verifyToken,cartcontroller.clearCart);
router.delete('/remove-from-cart/:productId',verifyToken,cartcontroller.removeFromCart);



module.exports = router;
