const express = require('express');
const router = express.Router();
const verifyToken = require('../Middlewares/verifyToken');
const cartcontroller=require('../Controllers/cart.controller')
router.use(verifyToken);

router.post('/',verifyToken,cartcontroller.addToCart);
router.get('/',verifyToken,cartcontroller.getCart);
router.delete('/:productId',verifyToken,cartcontroller.removeFromCart);
router.delete('/',verifyToken,cartcontroller.clearCart);



module.exports = router;
