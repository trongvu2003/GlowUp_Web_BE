const CartModel = require("../models/cart_model");
const CartItemModel = require("../models/cart_item_model");

class CartService {
  static async getCartByUserId(userId) {
    let cart = await CartModel.getByUserId(userId);

    if (!cart) {
      cart = await CartModel.create(userId);
    }

    const items = await CartItemModel.getByCartId(cart.id);

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return {
      user_id: userId,
      cart_id: cart.id,
      items: items,
      total_quantity: totalQuantity,
      total_price: totalPrice,
    };
  }

  static async addItemToCart(cartId, productId, quantity) {
    const existingItem = await CartItemModel.getByCartAndProduct(cartId, productId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      await CartItemModel.updateQuantity(cartId, productId, newQuantity);
    } else {
      await CartItemModel.create(cartId, productId, quantity);
    }

    return { message: "Item added to cart successfully" };
  }

  static async createCart(userId) {
    const existingCart = await CartModel.getByUserId(userId);
    if (existingCart) {
      return { message: "Cart already exists for this user", cart: existingCart };
    }
    const newCart = await CartModel.create(userId);
    return { message: "Cart created successfully", cart: newCart };
  }

  static async removeItemFromCart(itemId) {
    await CartItemModel.deleteById(itemId);
    return { message: "Item removed from cart successfully" };
  }

  static async clearCart(cartId) {
    await CartItemModel.deleteAllByCartId(cartId);
    return { message: "Cart cleared successfully" };
  }

  static async updateItemQuantity(itemId, quantity) {
    await CartItemModel.updateQuantityById(itemId, quantity);
    return { message: "Item quantity updated successfully" };
  }
}

module.exports = CartService;
