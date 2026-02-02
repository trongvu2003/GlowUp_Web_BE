const { sql, poolPromise } = require("../config/db");

class CartModel {
  static async getByUserId(userId) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query("SELECT * FROM carts WHERE user_id = @userId");

    return result.recordset[0] || null;
  }

  static async create(userId) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query("INSERT INTO carts (user_id) OUTPUT INSERTED.* VALUES (@userId)");
    
    return result.recordset[0];
  }
}

module.exports = CartModel;
