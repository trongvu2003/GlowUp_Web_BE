const { sql, poolPromise } = require("../config/db");


class ShippingTrackingModel {
  // Tạo tracking mới
  static async create(data) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('order_id', sql.Int, data.order_id)
        .input('status', sql.NVarChar, data.status)
        .input('location', sql.NVarChar, data.location)
        .input('description', sql.NVarChar, data.description)
        .input('updated_by', sql.Int, data.updated_by)
        .query(`
          INSERT INTO shipping_trackings 
          (order_id, status, location, description, updated_by)
          OUTPUT INSERTED.*
          VALUES (@order_id, @status, @location, @description, @updated_by)
        `);
      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }

  // Lấy lịch sử tracking theo order_id
  static async getByOrderId(orderId) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('orderId', sql.Int, orderId)
        .query(`
          SELECT 
            st.*,
            u.full_name as updated_by_name
          FROM shipping_trackings st
          LEFT JOIN users u ON st.updated_by = u.id
          WHERE st.order_id = @orderId
          ORDER BY st.created_at DESC
        `);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  // Lấy tracking mới nhất
  static async getLatestByOrderId(orderId) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('orderId', sql.Int, orderId)
        .query(`
          SELECT TOP 1 *
          FROM shipping_trackings
          WHERE order_id = @orderId
          ORDER BY created_at DESC
        `);
      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ShippingTrackingModel;