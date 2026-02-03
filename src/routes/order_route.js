const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrdersByUserId,
  deleteOrder,
} = require("../controllers/order_controller");

router.post("/create", createOrder);
router.get("/user/:userId", getOrdersByUserId);
router.delete("/:orderId", deleteOrder);

module.exports = router;
