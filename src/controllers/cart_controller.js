const CartService = require("../services/cart_service");

const getCartByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const data = await CartService.getCartByUserId(Number(userId));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching cart" });
  }
};

const addItemToCart = async (req, res) => {
  try {
    const { cartId, productId, quantity } = req.body;
    if (!cartId || !productId || !quantity) {
      return res.status(400).json({ message: "cartId, productId, and quantity are required" });
    }
    const result = await CartService.addItemToCart(Number(cartId), Number(productId), Number(quantity));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while adding item to cart" });
  }
};

const createCart = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    const result = await CartService.createCart(Number(userId));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while creating cart" });
  }
};

const removeItemFromCart = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Item ID is required" });
    }
    const result = await CartService.removeItemFromCart(Number(id));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while removing item from cart" });
  }
};

const clearCart = async (req, res) => {
  try {
    const { cartId } = req.params;
    if (!cartId) {
      return res.status(400).json({ message: "Cart ID is required" });
    }
    const result = await CartService.clearCart(Number(cartId));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while clearing cart" });
  }
};

const updateItemQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    if (!id || quantity === undefined) {
      return res.status(400).json({ message: "Item ID and quantity are required" });
    }
    const result = await CartService.updateItemQuantity(Number(id), Number(quantity));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while updating item quantity" });
  }
};

module.exports = {
  getCartByUserId,
  addItemToCart,
  createCart,
  removeItemFromCart,
  clearCart,
  updateItemQuantity,
};
