const { sql, poolPromise } = require("../config/db");

class OrderModel {
  static async create(userId, totalPrice, status, paymentMethod, address, phone, voucherId = null) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("totalPrice", sql.Decimal(18, 2), totalPrice)
      .input("status", sql.NVarChar, status)
      .input("paymentMethod", sql.NVarChar, paymentMethod)
      .input("address", sql.NVarChar, address)
      .input("phone", sql.NVarChar, phone)
      .input("voucherId", sql.Int, voucherId)
      .query(`
        INSERT INTO orders (user_id, total_price, status, payment_method, address, phone, voucher_id)
        OUTPUT INSERTED.*
        VALUES (@userId, @totalPrice, @status, @paymentMethod, @address, @phone, @voucherId)
      `);

    return result.recordset[0];
  }

  static async getByUserId(userId) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query("SELECT * FROM orders WHERE user_id = @userId ORDER BY created_at DESC");

    return result.recordset;
  }

  static async getAll() {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT * FROM orders ORDER BY created_at DESC");

    return result.recordset;
  }

  static async getById(orderId) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .query("SELECT * FROM orders WHERE id = @orderId");

    return result.recordset[0] || null;
  }

  static async deleteById(orderId) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .query("DELETE FROM orders WHERE id = @orderId");

    return { message: "Order deleted successfully" };
  }

  static async updateStatus(orderId, status) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .input("status", sql.NVarChar, status)
      .query("UPDATE orders SET status = @status WHERE id = @orderId");

    return { message: "Order status updated successfully" };
  }
}

module.exports = OrderModel;
