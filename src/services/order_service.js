const OrderModel = require("../models/order_model");
const OrderItemModel = require("../models/order_item_model");
const VoucherModel = require("../models/voucher_model");

class OrderService {
  static async createOrder(userId, items, totalPrice, status, paymentMethod, address, phone, voucherId = null) {
    // Validate input
    if (!userId || !items || items.length === 0 || !totalPrice || !status || !paymentMethod || !address || !phone) {
      throw new Error("Missing required fields");
    }

    // Create the order
    const order = await OrderModel.create(userId, totalPrice, status, paymentMethod, address, phone, voucherId);

    // Create order items
    for (const item of items) {
      await OrderItemModel.create(order.id, item.productId, item.quantity, item.price);
    }

    // Get voucher info if voucherId exists to return full object
    let voucher = null;
    if (voucherId) {
      voucher = await VoucherModel.getById(voucherId);
    }

    // Destructure to exclude voucher_id from response
    const { voucher_id, ...orderWithoutVoucherId } = order;

    return {
      message: "Order created successfully",
      order: {
        ...orderWithoutVoucherId,
        voucher: voucher
      },
    };
  }

  static async getOrdersByUserId(userId) {
    // Get all orders for the user
    const orders = await OrderModel.getByUserId(userId);

    // For each order, get its items and voucher info
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItemModel.getByOrderId(order.id);
        
        // Get voucher info if voucher_id exists
        let voucher = null;
        if (order.voucher_id) {
          voucher = await VoucherModel.getById(order.voucher_id);
        }
        
        // Destructure to exclude voucher_id from response
        const { voucher_id, ...orderWithoutVoucherId } = order;
        
        return {
          ...orderWithoutVoucherId,
          items: items,
          voucher: voucher,
        };
      })
    );

    return {
      orders: ordersWithItems,
    };
  }

  static async getAllOrders() {
    // Get all orders
    const orders = await OrderModel.getAll();

    // For each order, get its items and voucher info
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItemModel.getByOrderId(order.id);
        
        // Get voucher info if voucher_id exists
        let voucher = null;
        if (order.voucher_id) {
          voucher = await VoucherModel.getById(order.voucher_id);
        }
        
        // Destructure to exclude voucher_id from response
        const { voucher_id, ...orderWithoutVoucherId } = order;
        
        return {
          ...orderWithoutVoucherId,
          items: items,
          voucher: voucher,
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

  static async cancelOrder(orderId) {
    const order = await OrderModel.getById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Check status: only cancel if not shipping or completed
    const forbiddenStatuses = ["shipping", "completed", "cancelled"];
    if (forbiddenStatuses.includes(order.status.toLowerCase())) {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    await OrderModel.updateStatus(orderId, "cancelled");

    return {
      message: "Order cancelled successfully",
    };
  }
}

module.exports = OrderService;
