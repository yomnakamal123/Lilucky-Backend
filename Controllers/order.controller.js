const mongoose = require('mongoose');
const asyncwrapper = require('../asyncwrapper');
const appError = require('../appError');
const httpStatusText = require('../httpStatusText');
const Order = require('../Models/Order.model');
const Product = require('../Models/Product.model');
const Cart = require('../Models/Cart.model');
const Shipping = require('../Models/Shipping.model');
/* ===========================
   CLIENT FUNCTIONS
=========================== */

const createOrder = asyncwrapper(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    const userId = req.user._id;
    const body = req.body;

    /* ================= GET CART ================= */

    const cart = await Cart.findOne({ userId }).session(session);

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    /* ================= NORMALIZE ADDRESS ================= */

    const address = body.deliveryAddress || body.shippingAddress;

    if (!address) {
      throw new Error("Delivery address is required");
    }

    const governorate = address.governorate?.toLowerCase().trim();
    const city = address.city;
    const street = address.street;

    /* ================= CALCULATE ORDER ITEMS ================= */

    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {

      const product = await Product.findById(item.productId).session(session);

      if (!product) {
        throw new Error("Product not found");
      }

      if (product.stock < item.quantity) {
        throw new Error(`Not enough stock for ${product.name}`);
      }

      const price = product.price;

      subtotal += price * item.quantity;

      orderItems.push({
        productId: product._id,
        name: product.name,
        price,
        quantity: item.quantity
      });

      product.stock -= item.quantity;
      await product.save({ session });
    }

    /* ================= SHIPPING ================= */

    const shipping = await Shipping.findOne({
      governorate: governorate
    }).session(session);

    if (!shipping) {
      throw new Error("Shipping not found for this governorate");
    }

    const deliveryPrice = shipping.price;

    /* ================= TOTAL ================= */

    const totalAmount = subtotal + deliveryPrice;

    /* ================= CREATE ORDER ================= */

    const order = await Order.create([{
      userId,
      items: orderItems,
      subtotal,
      deliveryPrice,
      totalAmount,
      paymentMethod: body.paymentMethod || "cash",

      deliveryAddress: {
        governorate,
        city,
        address: street
      }

    }], { session });

    /* ================= CLEAR CART ================= */

    await Cart.updateOne(
      { userId },
      { $set: { items: [] } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      status: "success",
      data: order[0]
    });

  } catch (error) {

    await session.abortTransaction();
    session.endSession();

    return next(error);
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
// const getAllOrders = asyncwrapper(async (req, res, next) => {
//   const orders = await Order.find().sort({ createdAt: -1 });

//   res.status(200).json({
//     status: httpStatusText.SUCCESS,
//     results: orders.length,
//     data: { orders }
//   });
// });


const getAllOrders = asyncwrapper(async (req, res, next) => {
  const orders = await Order.find()
    .populate("userId", "firstName lastName email phoneNumber") 
    .sort({ createdAt: -1 });

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

