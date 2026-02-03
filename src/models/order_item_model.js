const { sql, poolPromise } = require("../config/db");

class OrderItemModel {
  static async create(orderId, productId, quantity, price) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .input("productId", sql.Int, productId)
      .input("quantity", sql.Int, quantity)
      .input("price", sql.Decimal(18, 2), price)
      .query(`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        OUTPUT INSERTED.*
        VALUES (@orderId, @productId, @quantity, @price)
      `);

    return result.recordset[0];
  }

  static async getByOrderId(orderId) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .query("SELECT * FROM order_items WHERE order_id = @orderId");

    return result.recordset;
  }

  static async deleteByOrderId(orderId) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .query("DELETE FROM order_items WHERE order_id = @orderId");

    return { message: "Order items deleted successfully" };
  }
}

module.exports = OrderItemModel;
