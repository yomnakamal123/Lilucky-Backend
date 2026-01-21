const express = require('express');
const router = express.Router();
const verifyToken = require('../Middlewares/verifyToken');
const cartcontroller=require('../Controllers/cart.controller')
router.use(verifyToken);

router.post('/',verifyToken,cartcontroller.addToCart);
router.get('/',verifyToken,cartcontroller.getCart);
router.delete('/',verifyToken,cartcontroller.clearCart);
router.delete('/:productId',verifyToken,cartcontroller.removeFromCart);



module.exports = router;
