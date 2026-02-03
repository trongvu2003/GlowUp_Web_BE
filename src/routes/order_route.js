const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrdersByUserId,
  getAllOrders,
  deleteOrder,
} = require("../controllers/order_controller");

router.post("/create", createOrder);
router.get("/user/:userId", getOrdersByUserId);
router.get("/", getAllOrders);
router.delete("/:orderId", deleteOrder);

module.exports = router;
