const express = require("express");
const router = express.Router();

const {
  getCartByUserId,
  addItemToCart,
  createCart,
  removeItemFromCart,
  clearCart,
  updateItemQuantity,
} = require("../controllers/cart_controller");

router.get("/get-cart-by-user/:userId", getCartByUserId);
router.post("/add-item", addItemToCart);
router.post("/create-cart", createCart);
router.delete("/remove-item/:id", removeItemFromCart);
router.delete("/clear-all-cart-item/:cartId", clearCart);
router.put("/update-item-quantity/:id", updateItemQuantity);

module.exports = router;
