const OrderService = require("../services/order_service");

const createOrder = async (req, res) => {
  try {
    const { userId, items, totalPrice, status, paymentMethod, address, phone, voucherId } = req.body;
    
    if (!userId || !items || !totalPrice || !status || !paymentMethod || !address || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items must be a non-empty array" });
    }

    const result = await OrderService.createOrder(
      Number(userId),
      items,
      Number(totalPrice),
      status,
      paymentMethod,
      address,
      phone,
      voucherId ? Number(voucherId) : null
    );
    
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error while creating order" });
  }
};

const getOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const result = await OrderService.getOrdersByUserId(Number(userId));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching orders" });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const result = await OrderService.getAllOrders();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching all orders" });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const result = await OrderService.deleteOrder(Number(orderId));
    res.json(result);
  } catch (err) {
    console.error(err);
    if (err.message === "Order not found") {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: "Server error while deleting order" });
  }
};

module.exports = {
  createOrder,
  getOrdersByUserId,
  getAllOrders,
  deleteOrder,
};
