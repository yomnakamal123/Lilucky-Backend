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

    const cart = await Cart.findOne({ userId }).session(session);

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    const address = body.deliveryAddress || body.shippingAddress;

    if (!address) {
      throw new Error("Delivery address is required");
    }

    const governorate = address.governorate?.toLowerCase().trim();
    const city = address.city;
    const street = address.street;

    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {

      const product = await Product.findById(item.productId).session(session);

      if (!product) {
        throw new Error("Product not found");
      }

      const price = product.price;

      subtotal += price * item.quantity;

      orderItems.push({
        productId: product._id,
        name: product.name,
        price,
        quantity: item.quantity,
        color: item.color,
        size: item.size
      });
    }

    const shipping = await Shipping.findOne({
      governorate
    }).session(session);

    if (!shipping) {
      throw new Error("Shipping not found for this governorate");
    }

    const deliveryPrice = shipping.price;
    const totalAmount = subtotal + deliveryPrice;

    const order = await Order.create([{
      userId,
      items: orderItems,
      subtotal,
      deliveryPrice,
      totalAmount,
      paymentMethod: body.paymentMethod || "cash",
      orderStatus: "pending",

      deliveryAddress: {
        governorate,
        city,
        street
      }
    }], { session });

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


//* ===========================
//*    GET MY ORDERS
//* ===========================

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
  const orders = await Order.find()
    .populate("userId", "firstName lastName email phoneNumber") 
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    results: orders.length,
    data: { orders }
  });
});

//* ===========================
//*    UPDATE ORDER STATUS
//* =========================== 


const updateOrderStatus = asyncwrapper(async (req, res, next) => {
  const { id } = req.params;
  const { orderStatus } = req.body;

  const allowedStatus = Order.schema.path('orderStatus').enumValues;

  if (!allowedStatus.includes(orderStatus)) {
    return next(
      appError.create(
        `Invalid status. Must be one of: ${allowedStatus.join(', ')}`,
        400
      )
    );
  }

  const order = await Order.findById(id);

  if (!order) {
    return next(appError.create('Order not found', 404));
  }

  /* ================= BLOCK IF CANCELLED ================= */
  if (order.orderStatus === "cancelled") {
    return next(appError.create("Order is already cancelled", 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    /* ================= CONFIRM ORDER ================= */
    if (orderStatus === "confirmed" && order.orderStatus === "pending") {

      for (const item of order.items) {

        const product = await Product.findById(item.productId).session(session);

        if (product) {
          product.stock -= item.quantity;

          if (product.stock < 0) {
            throw new Error(`Stock cannot be negative for ${product.name}`);
          }

          await product.save({ session });
        }
      }
    }

    /* ================= CANCEL ORDER ================= */
    if (orderStatus === "cancelled" && order.orderStatus === "confirmed") {

      for (const item of order.items) {

        const product = await Product.findById(item.productId).session(session);

        if (product) {
          product.stock += item.quantity;
          await product.save({ session });
        }
      }
    }

    /* ================= UPDATE STATUS ================= */
    order.orderStatus = orderStatus;
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      status: "success",
      data: { order }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(error);
  }
});


//* ===========================
//*    GET MOST SELLING PRODUCT
//* ===========================


const getMostSellingProduct = asyncwrapper(async (req, res, next) => {
  const result = await Order.aggregate([
    // Optional: only delivered orders
    // { $match: { orderStatus: 'delivered' } },

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

