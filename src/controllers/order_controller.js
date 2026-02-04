const OrderService = require("../services/order_service");

const createOrder = async (req, res) => {
  try {
      const userId = req.user.id;
      const orderData = {
        user_id: userId,
        ...req.body
      };

      const newOrder = await orderService.createOrder(orderData);

      res.status(201).json({
        success: true,
        message: "Đặt hàng thành công",
        data: newOrder
      });
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
const getById = async(req, res)=>{
  try {
    const {orderId} = req.params;
    const result= await OrderService.getById(orderId);
    res.json({
      success:true,
      data:result
    });
  } catch (error) {
    res.status(500).json({
      success:false,
      message:error.message
    });
  }
};
const updateStatus = async(req, res)=>{
  try {
    const {orderId} = req.params;
    const {status} = req.body;
    const result= await OrderService.updateOrderStatus(orderId,status)
    res.json({
      success:true,
      message:"Cập nhật trạng thái thành công",
      data:result
    });
  } catch (error) {
    res.status(500).json({
      success:false,
      message:error.message
    });
  }
};
const updateShippingStatus = async(req, res)=>{
  try {
    const {orderId} = req.params;
    const {shipping_status} = req.body;
    const result= await OrderService.updateShippingStatus(orderId,shipping_status)
    res.json({
      success:true,
      message:"Cập nhật trạng thái vận chuyển thành công",
      data:result
    });
  } catch (error) {
    res.status(500).json({
      success:false,
      message:error.message
    });
  }
};
const updateShippingInfo = async(req, res)=>{
  try {
    const {orderId} = req.params;
    const shippingData = req.body;
    const result= await OrderService.updateOrderStatus(orderId,shippingData)
    res.json({
      success:true,
      message:"Cập nhật thông tin vận chuyển thành công",
      data:result
    });
  } catch (error) {
    res.status(500).json({
      success:false,
      message:error.message
    });
  }
};
const confirmDelivery = async(req, res)=>{
  try {
    const {orderId} = req.params;
    const result= await OrderService.updateOrderStatus(orderId)
    res.json({
      success:true,
      message:"Cập nhật giao hàng thành công",
      data:result
    });
  } catch (error) {
    res.status(500).json({
      success:false,
      message:error.message
    });
  }
};
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const result = await OrderService.cancelOrder(Number(orderId));
    res.json(result);
  } catch (err) {
    console.error(err);
    if (err.message === "Order not found") {
      return res.status(404).json({ message: err.message });
    }
    if (err.message.startsWith("Cannot cancel order")) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Server error while cancelling order" });
  }
};

  const getStatistics = async(req, res)=>{
    try {
      const result= await OrderService.getStatistics();
      res.json({
        success:true,
        message:"Cập nhật trạng thái thành công",
        data:result
      });
    } catch (error) {
      res.status(500).json({
        success:false,
        message:error.message
      });
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
  };

};

module.exports = {
  createOrder,
  getOrdersByUserId,
  getAllOrders,
  cancelOrder,
  deleteOrder,
  getById,
  updateStatus,
  updateShippingStatus,
  updateShippingInfo,
  confirmDelivery,
  getStatistics
};
