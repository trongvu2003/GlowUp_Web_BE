const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrdersByUserId,
  getAllOrders,
  cancelOrder,
  deleteOrder,
  getById,
  getStatistics,
  updateShippingInfo,
  updateShippingStatus,
  updateStatus,
  confirmDelivery
} = require("../controllers/order_controller");

router.post("/create", createOrder);
router.get("/user/:userId", getOrdersByUserId);
router.get("/", getAllOrders);
router.post("/cancel/:orderId", cancelOrder);
router.delete("/:orderId", deleteOrder);
router.get("/:orderId", getById);
router.patch("/:orderId/status", updateStatus);
router.patch("/:orderId/shipping-status", updateShippingStatus);
router.put("/:orderId/shipping-info",updateShippingInfo);
router.patch("/:orderId/confirm-deliver",confirmDelivery);
router.get("/admin/statistics", getStatistics);



module.exports = router;
