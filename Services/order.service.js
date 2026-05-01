const mongoose = require("mongoose");
const Cart = require("../Models/Cart.model");
const Product = require("../Models/Product.model");
const Shipping = require("../Models/Shipping.model");
const Order = require("../Models/Order.model");

exports.createOrder = async (userId, body) => {

  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    const cart = await Cart.findOne({ userId }).session(session);

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

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

      // نقص المخزون
      product.stock -= item.quantity;
      await product.save({ session });
    }

    // الشحن
    const shipping = await Shipping.findOne({
      governorate: body.deliveryAddress.governorate
    }).session(session);

    const deliveryPrice = shipping?.price || 0;

    const totalAmount = subtotal + deliveryPrice;

    // إنشاء الطلب
    const order = await Order.create([{
      userId,
      items: orderItems,
      subtotal,
      deliveryPrice,
      totalAmount,
      paymentMethod: body.paymentMethod || "cash",
      deliveryAddress: body.deliveryAddress
    }], { session });

    // تفريغ الكارت
    await Cart.updateOne(
      { userId },
      { $set: { items: [] } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return order[0];

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};