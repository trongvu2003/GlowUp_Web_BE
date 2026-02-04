const { sql, poolPromise } = require("../config/db");

class OrderModel {
  /**
   * Tạo order mới (đầy đủ)
   */
  static async create(orderData) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", sql.Int, orderData.user_id)
      .input("totalPrice", sql.Decimal(12, 0), orderData.total_price)
      .input("status", sql.NVarChar, orderData.status || 'pending')
      .input("paymentMethod", sql.NVarChar, orderData.payment_method)
      .input("address", sql.NVarChar, orderData.address)
      .input("phone", sql.VarChar, orderData.phone)
      .input("voucherId", sql.Int, orderData.voucher_id)
      
      // Shipping fields
      .input("shippingProviderId", sql.Int, orderData.shipping_provider_id)
      .input("shippingMethodId", sql.Int, orderData.shipping_method_id)
      .input("shippingCode", sql.NVarChar, orderData.shipping_code)
      .input("shippingStatus", sql.NVarChar, orderData.shipping_status || 'pending')
      .input("estimatedDeliveryDate", sql.DateTime, orderData.estimated_delivery_date)
      .input("actualDeliveryDate", sql.DateTime, orderData.actual_delivery_date)
      .input("shippingNote", sql.NVarChar, orderData.shipping_note)
      // gps
      .input("shippingLatitude", sql.Decimal(10, 8), orderData.shipping_latitude)
      .input("shippingLongitude", sql.Decimal(11, 8), orderData.shipping_longitude)
      .query(`
        INSERT INTO orders (
          user_id, total_price, status, payment_method, address, phone, voucher_id,
          shipping_provider_id, shipping_method_id, shipping_code, shipping_status,
          estimated_delivery_date, actual_delivery_date, shipping_note,shipping_latitude, shipping_longitude
        )
        OUTPUT INSERTED.*
        VALUES (
          @userId, @totalPrice, @status, @paymentMethod, @address, @phone, @voucherId,
          @shippingProviderId, @shippingMethodId, @shippingCode, @shippingStatus,
          @estimatedDeliveryDate, @actualDeliveryDate, @shippingNote,@shipping_latitude, @shipping_longitude
        )
      `);

    return result.recordset[0];
  }

  /**
   * Lấy orders theo user_id
   */
  static async getByUserId(userId) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query(`
        SELECT 
          o.*,
          u.full_name as customer_name,
          u.email as customer_email,
          sp.name as shipping_provider_name,
          sm.name as shipping_method_name,
          v.code as voucher_code,
          v.discount_value as voucher_discount
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN shipping_providers sp ON o.shipping_provider_id = sp.id
        LEFT JOIN shipping_methods sm ON o.shipping_method_id = sm.id
        LEFT JOIN vouchers v ON o.voucher_id = v.id
        WHERE o.user_id = @userId
        ORDER BY o.created_at DESC
      `);

    return result.recordset;
  }

  /**
   * Lấy tất cả orders (Admin)
   */
  static async getAll() {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query(`
        SELECT 
          o.*,
          u.full_name as customer_name,
          u.email as customer_email,
          u.phone as customer_phone,
          sp.name as shipping_provider_name,
          sm.name as shipping_method_name,
          v.code as voucher_code
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN shipping_providers sp ON o.shipping_provider_id = sp.id
        LEFT JOIN shipping_methods sm ON o.shipping_method_id = sm.id
        LEFT JOIN vouchers v ON o.voucher_id = v.id
        ORDER BY o.created_at DESC
      `);

    return result.recordset;
  }

  /**
   * Lấy order theo ID
   */
  static async getById(orderId) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .query(`
        SELECT 
          o.*,
          u.full_name as customer_name,
          u.email as customer_email,
          u.phone as customer_phone,
          sp.name as shipping_provider_name,
          sp.code as shipping_provider_code,
          sm.name as shipping_method_name,
          sm.code as shipping_method_code,
          v.code as voucher_code,
          v.discount_type,
          v.discount_value
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN shipping_providers sp ON o.shipping_provider_id = sp.id
        LEFT JOIN shipping_methods sm ON o.shipping_method_id = sm.id
        LEFT JOIN vouchers v ON o.voucher_id = v.id
        WHERE o.id = @orderId
      `);

    return result.recordset[0] || null;
  }

  /**
   * Xóa order
   */
  static async deleteById(orderId) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .query("DELETE FROM orders WHERE id = @orderId");

    return { message: "Order deleted successfully" };
  }

  /**
   * Cập nhật trạng thái order
   */
  static async updateStatus(orderId, status) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .input("status", sql.NVarChar, status)
      .query(`
        UPDATE orders 
        SET status = @status
        OUTPUT INSERTED.*
        WHERE id = @orderId
      `);

    return result.recordset[0];
  }

  /**
   * Cập nhật shipping status
   */
  static async updateShippingStatus(orderId, shippingStatus) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .input("shippingStatus", sql.NVarChar, shippingStatus)
      .query(`
        UPDATE orders 
        SET shipping_status = @shippingStatus
        OUTPUT INSERTED.*
        WHERE id = @orderId
      `);

    return result.recordset[0];
  }

  /**
   * Cập nhật shipping code (mã vận đơn)
   */
  static async updateShippingCode(orderId, shippingCode) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .input("shippingCode", sql.NVarChar, shippingCode)
      .query(`
        UPDATE orders 
        SET shipping_code = @shippingCode
        OUTPUT INSERTED.*
        WHERE id = @orderId
      `);

    return result.recordset[0];
  }

  /**
   * Cập nhật ngày giao hàng thực tế
   */
  static async updateActualDeliveryDate(orderId, actualDate) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .input("actualDate", sql.DateTime, actualDate)
      .query(`
        UPDATE orders 
        SET actual_delivery_date = @actualDate,
            shipping_status = 'delivered'
        OUTPUT INSERTED.*
        WHERE id = @orderId
      `);

    return result.recordset[0];
  }

  /**
   * Cập nhật thông tin shipping đầy đủ
   */
  static async updateShippingInfo(orderId, shippingData) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("orderId", sql.Int, orderId)
      .input("shippingProviderId", sql.Int, shippingData.shipping_provider_id)
      .input("shippingMethodId", sql.Int, shippingData.shipping_method_id)
      .input("shippingCode", sql.NVarChar, shippingData.shipping_code)
      .input("shippingStatus", sql.NVarChar, shippingData.shipping_status)
      .input("estimatedDeliveryDate", sql.DateTime, shippingData.estimated_delivery_date)
      .input("shippingNote", sql.NVarChar, shippingData.shipping_note)
      .query(`
        UPDATE orders 
        SET 
          shipping_provider_id = @shippingProviderId,
          shipping_method_id = @shippingMethodId,
          shipping_code = @shippingCode,
          shipping_status = @shippingStatus,
          estimated_delivery_date = @estimatedDeliveryDate,
          shipping_note = @shippingNote
        OUTPUT INSERTED.*
        WHERE id = @orderId
      `);

    return result.recordset[0];
  }

  /**
   * Lấy orders theo shipping_status
   */
  static async getByShippingStatus(shippingStatus) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("shippingStatus", sql.NVarChar, shippingStatus)
      .query(`
        SELECT 
          o.*,
          u.full_name as customer_name,
          u.email as customer_email,
          sp.name as shipping_provider_name,
          sm.name as shipping_method_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN shipping_providers sp ON o.shipping_provider_id = sp.id
        LEFT JOIN shipping_methods sm ON o.shipping_method_id = sm.id
        WHERE o.shipping_status = @shippingStatus
        ORDER BY o.created_at DESC
      `);

    return result.recordset;
  }

  /**
   * Lấy orders theo payment_method
   */
  static async getByPaymentMethod(paymentMethod) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("paymentMethod", sql.NVarChar, paymentMethod)
      .query(`
        SELECT 
          o.*,
          u.full_name as customer_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.payment_method = @paymentMethod
        ORDER BY o.created_at DESC
      `);

    return result.recordset;
  }

  /**
   * Lấy orders trong khoảng thời gian
   */
  static async getByDateRange(startDate, endDate) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("startDate", sql.DateTime, startDate)
      .input("endDate", sql.DateTime, endDate)
      .query(`
        SELECT 
          o.*,
          u.full_name as customer_name,
          u.email as customer_email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.created_at BETWEEN @startDate AND @endDate
        ORDER BY o.created_at DESC
      `);

    return result.recordset;
  }

  /**
   * Thống kê orders
   */
  static async getStatistics() {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
          SUM(CASE WHEN shipping_status = 'pending' THEN 1 ELSE 0 END) as pending_shipping,
          SUM(CASE WHEN shipping_status = 'delivered' THEN 1 ELSE 0 END) as delivered,
          SUM(total_price) as total_revenue,
          AVG(total_price) as average_order_value
        FROM orders
      `);

    return result.recordset[0];
  }
}

module.exports = OrderModel;