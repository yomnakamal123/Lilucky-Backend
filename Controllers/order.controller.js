const mongoose = require('mongoose');
const Order = require('../Models/Order.model');
const Product = require('../Models/Product.model');
const Cart = require('../Models/Cart.model');
const asyncwrapper = require('../asyncwrapper');
const appError = require('../appError');
const httpStatusText = require('../httpStatusText');

/* ===========================
   CLIENT FUNCTIONS
=========================== */

const createOrder = asyncwrapper(async (req, res, next) => {
  const userId = req.user._id;
  const { deliveryAddress, paymentMethod } = req.body;

  if (
    !deliveryAddress?.city ||
    !deliveryAddress?.location ||
    !deliveryAddress?.phoneNumber
  ) {
    return next(appError.create('Delivery address is required', 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const cart = await Cart.findOne({ userId }).session(session);

    if (!cart || cart.items.length === 0) {
      throw appError.create('Cart is empty', 400);
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.productId).session(session);

      if (!product) {
        throw appError.create('Product not found', 404);
      }

      if (product.stock < item.quantity) {
        throw appError.create(`Not enough stock for ${product.name}`, 400);
      }

      totalAmount += product.price * item.quantity;

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity
      });

      product.stock -= item.quantity;
      await product.save({ session });
    }

    const [order] = await Order.create(
      [
        {
          userId,
          items: orderItems,
          totalAmount,
          paymentMethod,
          deliveryAddress,
          orderStatus: 'pending'
        }
      ],
      { session }
    );

    // ✅ CLEAR CART
    await Cart.findOneAndUpdate(
      { userId },
      { items: [] },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      status: httpStatusText.SUCCESS,
      data: { order }
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(err);
  }
});



const getMyOrders = asyncwrapper(async (req, res, next) => {
  const userId = req.user._id;

  const orders = await Order.find({ userId }).sort({ createdAt: -1 });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    results: orders.length,
    data: { orders }
  });
});

/* ===========================
   ADMIN FUNCTIONS
=========================== */
const getAllOrders = asyncwrapper(async (req, res, next) => {
  const orders = await Order.find().sort({ createdAt: -1 });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    results: orders.length,
    data: { orders }
  });
});


const updateOrderStatus = asyncwrapper(async (req, res, next) => {
  const { id } = req.params;
  const { orderStatus } = req.body;

  const allowedStatus = Order.schema.path('orderStatus').enumValues;
  if (!allowedStatus.includes(orderStatus)) {
    return next(appError.create(`Invalid status. Must be one of: ${allowedStatus.join(', ')}`, 400));
  }

  const order = await Order.findByIdAndUpdate(
    id,
    { orderStatus },
    { new: true } 
  );

  if (!order) {
    return next(appError.create('Order not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { order }
  });
});


const getMostSellingProduct = asyncwrapper(async (req, res, next) => {
  const result = await Order.aggregate([
    // Optional: only delivered orders
    // { $match: { orderStatus: 'delivered' } },

    // 1️⃣ Unwind items array
    { $unwind: '$items' },

    // 2️⃣ Group by productId and sum quantities
    {
      $group: {
        _id: '$items.productId',
        totalSold: { $sum: '$items.quantity' }
      }
    },

    // 3️⃣ Sort descending
    { $sort: { totalSold: -1 } },

    // 4️⃣ Take top 1
    { $limit: 1 },

    // 5️⃣ Lookup product details
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },

    { $unwind: '$product' },

    // 6️⃣ Project only id and name
    {
      $project: {
        _id: 0,
        totalSold: 1,
        product: {
          _id: '$product._id',
          name: '$product.name'
        }
      }
    }
  ]);

  if (!result.length) {
    return next(appError.create('No sales found', 404));
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: result[0]
  });
});



module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  getMostSellingProduct
};
