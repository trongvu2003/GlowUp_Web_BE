const { sql, poolPromise } = require("../config/db");

class CartItemModel {
  static async getByCartId(cartId) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("cartId", sql.Int, cartId)
      .query(`
        SELECT ci.*, p.name, p.price, p.brand, p.images, p.gender, p.description
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = @cartId
      `);

    return result.recordset.map(item => ({
      ...item,
      images: JSON.parse(item.images || "[]")
    }));
  }

  static async getByCartAndProduct(cartId, productId) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("cartId", sql.Int, cartId)
      .input("productId", sql.Int, productId)
      .query("SELECT * FROM cart_items WHERE cart_id = @cartId AND product_id = @productId");

    return result.recordset[0] || null;
  }

  static async create(cartId, productId, quantity) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("cartId", sql.Int, cartId)
      .input("productId", sql.Int, productId)
      .input("quantity", sql.Int, quantity)
      .query("INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (@cartId, @productId, @quantity)");
  }

  static async updateQuantity(cartId, productId, quantity) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("cartId", sql.Int, cartId)
      .input("productId", sql.Int, productId)
      .input("quantity", sql.Int, quantity)
      .query("UPDATE cart_items SET quantity = @quantity WHERE cart_id = @cartId AND product_id = @productId");
  }

  static async deleteById(id) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM cart_items WHERE id = @id");
  }

  static async deleteAllByCartId(cartId) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("cartId", sql.Int, cartId)
      .query("DELETE FROM cart_items WHERE cart_id = @cartId");
  }

  static async updateQuantityById(id, quantity) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("quantity", sql.Int, quantity)
      .query("UPDATE cart_items SET quantity = @quantity WHERE id = @id");
  }
}

module.exports = CartItemModel;
