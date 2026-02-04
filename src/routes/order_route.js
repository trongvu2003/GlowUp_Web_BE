const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrdersByUserId,
  getAllOrders,
  cancelOrder,
  deleteOrder,
} = require("../controllers/order_controller");

router.post("/create", createOrder);
router.get("/user/:userId", getOrdersByUserId);
router.get("/", getAllOrders);
router.post("/cancel/:orderId", cancelOrder);
router.delete("/:orderId", deleteOrder);

module.exports = router;
