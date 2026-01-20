const Cart = require('../Models/Cart.model');
const Product = require('../Models/Product.model');
const asyncwrapper = require('../asyncwrapper');
const appError = require('../appError');

const addToCart = asyncwrapper(async (req, res, next) => {
  const userId = req.user._id;
  const { productId, quantity } = req.body;

  if (!productId || !quantity) {
    return next(appError.create('Product and quantity are required', 400));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(appError.create('Product not found', 404));
  }

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = await Cart.create({
      userId,
      items: []
    });
  }

  const itemIndex = cart.items.findIndex(
    item => item.productId.toString() === productId
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += quantity;
  } else {
    cart.items.push({
      productId,
      price: product.price,
      quantity
    });
  }

  await cart.save(); 

  res.status(200).json({
    status: 'success',
    data: { cart }
  });
});

const getCart = asyncwrapper(async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id })
    .populate('items.productId', 'name price');

  res.status(200).json({
    status: 'success',
    data: { cart }
  });
});

const removeFromCart = asyncwrapper(async (req, res, next) => {
  const userId = req.user._id;
  const productId = req.params.productId; // ✅ use params

  if (!productId) {
    return next(appError.create('Product ID is required', 400));
  }

  const cart = await Cart.findOne({ userId });
  if (!cart) {
    return next(appError.create('Cart not found', 404));
  }

  const itemIndex = cart.items.findIndex(
    item => item.productId.toString() === productId
  );

  if (itemIndex === -1) {
    return next(appError.create('Product not in cart', 404));
  }

  cart.items.splice(itemIndex, 1);
  await cart.save();

  res.status(200).json({
    status: 'success',
    data: { cart }
  });
});

const clearCart = asyncwrapper(async (req, res) => {
  await Cart.findOneAndUpdate(
    { userId: req.user._id },
    { items: [] }
  );

  res.status(200).json({
    status: 'success',
    message: 'Cart cleared'
  });
});
 


module.exports ={
    addToCart,
   getCart,
   removeFromCart,
   clearCart,
};
