const Order = require("../Models/Order.model");
const Product = require("../Models/Product.model");
const mongoose = require("mongoose");

const getDashboard = async (req, res) => {
  try {
    const orders = await Order.find();

    const totalOrders = orders.length;

    const completedOrders = orders.filter(
      (o) => o.orderStatus === "delivered"
    ).length;

    const cancelledOrders = orders.filter(
      (o) => o.orderStatus === "cancelled"
    ).length;

    // 💰 Revenue
    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    // 📦 Products
    const products = await Product.find();

    // Top selling products
    const productSalesMap = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const id = item.productId.toString();

        if (!productSalesMap[id]) {
          productSalesMap[id] = {
            productId: item.productId,
            name: item.name,
            sold: 0,
          };
        }

        productSalesMap[id].sold += item.quantity;
      });
    });

    const sortedProducts = Object.values(productSalesMap).sort(
      (a, b) => b.sold - a.sold
    );

    const topSellingProducts = sortedProducts.slice(0, 5);
    const lowSellingProducts = sortedProducts.slice(-5);

    // Stock
    const stock = products.map((p) => ({
      id: p._id,
      name: p.name,
      stock: p.stock,
    }));

    // 👥 Customers
    const userOrderMap = {};

    orders.forEach((o) => {
      const id = o.userId.toString();
      if (!userOrderMap[id]) userOrderMap[id] = 0;
      userOrderMap[id]++;
    });

    const totalCustomers = Object.keys(userOrderMap).length;

    const repeatCustomers = Object.values(userOrderMap).filter(
      (count) => count > 1
    ).length;

    const newCustomers = totalCustomers - repeatCustomers;

    // AOV
    const averageOrderValue =
      totalOrders > 0 ? totalSales / totalOrders : 0;
    const estimatedCost = totalSales * 0.6;
    const netProfit = totalSales - estimatedCost;

    const profitMargin =
      totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    res.json({
      success: true,
      data: {
        financial: {
          total_sales: totalSales,
          net_profit: netProfit,
          profit_margin: profitMargin.toFixed(2),
        },

        orders: {
          total_orders: totalOrders,
          completed_orders: completedOrders,
          cancelled_orders: cancelledOrders,
        },

        customers: {
          new_customers: newCustomers,
          repeat_customers: repeatCustomers,
          average_order_value: averageOrderValue,
        },

        products: {
          top_selling_products: topSellingProducts,
          low_selling_products: lowSellingProducts,
          stock,
        },
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Dashboard error",
    });
  }
};

module.exports = { getDashboard };