const OrderModel = require("../models/order_model");
const OrderItemModel = require("../models/order_item_model");

class OrderService {
  static async createOrder(userId, items, totalPrice, status, paymentMethod, address, phone) {
    // Validate input
    if (!userId || !items || items.length === 0 || !totalPrice || !status || !paymentMethod || !address || !phone) {
      throw new Error("Missing required fields");
    }

    // Create the order
    const order = await OrderModel.create(userId, totalPrice, status, paymentMethod, address, phone);

    // Create order items
    for (const item of items) {
      await OrderItemModel.create(order.id, item.productId, item.quantity, item.price);
    }

    return {
      message: "Order created successfully",
      order: order,
    };
  }

  static async getOrdersByUserId(userId) {
    // Get all orders for the user
    const orders = await OrderModel.getByUserId(userId);

    // For each order, get its items
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItemModel.getByOrderId(order.id);
        return {
          ...order,
          items: items,
        };
      })
    );

    return {
      orders: ordersWithItems,
    };
  }

  static async deleteOrder(orderId) {
    // Check if order exists
    const order = await OrderModel.getById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Delete order items first (cascade delete)
    await OrderItemModel.deleteByOrderId(orderId);

    // Delete the order
    await OrderModel.deleteById(orderId);

    return {
      message: "Order deleted successfully",
    };
  }
}

module.exports = OrderService;
