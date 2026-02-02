const { sql, poolPromise } = require('../config/db');

class PaymentModel {
  /**
   * Tạo payment mới
   */
  async create(orderId, paymentMethod, amount) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('order_id', sql.Int, orderId)
        .input('payment_method', sql.NVarChar, paymentMethod)
        .input('amount', sql.Decimal(12, 0), amount)
        .output('payment_id', sql.Int)
        .execute('sp_create_payment');

      return {
        success: true,
        paymentId: result.output.payment_id
      };
    } catch (error) {
      console.error('Create payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cập nhật payment thành công
   */
  async complete(paymentId, paymentData) {
    try {
      const pool = await poolPromise;
      await pool.request()
        .input('payment_id', sql.Int, paymentId)
        .input('transaction_no', sql.NVarChar, paymentData.transactionNo)
        .input('bank_code', sql.NVarChar, paymentData.bankCode)
        .input('bank_tran_no', sql.NVarChar, paymentData.bankTranNo)
        .input('card_type', sql.NVarChar, paymentData.cardType)
        .input('pay_date', sql.NVarChar, paymentData.payDate)
        .input('payment_data', sql.NVarChar, JSON.stringify(paymentData.rawData))
        .execute('sp_complete_payment');

      return { success: true };
    } catch (error) {
      console.error('Complete payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Đánh dấu payment thất bại
   */
  async fail(paymentId, responseCode, responseMessage) {
    try {
      const pool = await poolPromise;
      await pool.request()
        .input('payment_id', sql.Int, paymentId)
        .input('response_code', sql.NVarChar, responseCode)
        .input('response_message', sql.NVarChar, responseMessage)
        .execute('sp_fail_payment');

      return { success: true };
    } catch (error) {
      console.error('Fail payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Lấy payment theo ID
   */
  async getById(paymentId) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('paymentId', sql.Int, paymentId)
        .query(`
          SELECT 
            p.*,
            o.id as order_id,
            o.user_id,
            o.total_price as order_total,
            o.status as order_status,
            o.payment_status as order_payment_status
          FROM payments p
          INNER JOIN orders o ON p.order_id = o.id
          WHERE p.id = @paymentId
        `);

      if (result.recordset.length === 0) {
        return { success: false, message: 'Payment not found' };
      }

      return {
        success: true,
        data: result.recordset[0]
      };
    } catch (error) {
      console.error('Get payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Lấy payments theo order ID
   */
  async getByOrderId(orderId) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('orderId', sql.Int, orderId)
        .query(`
          SELECT * FROM payments
          WHERE order_id = @orderId
          ORDER BY created_at DESC
        `);

      return {
        success: true,
        data: result.recordset
      };
    } catch (error) {
      console.error('Get payments by order error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Lấy payment đang pending của order
   */
  async getPendingByOrderId(orderId) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('orderId', sql.Int, orderId)
        .query(`
          SELECT TOP 1 * FROM payments
          WHERE order_id = @orderId 
          AND status IN ('pending', 'processing')
          ORDER BY created_at DESC
        `);

      if (result.recordset.length === 0) {
        return { success: false, message: 'No pending payment found' };
      }

      return {
        success: true,
        data: result.recordset[0]
      };
    } catch (error) {
      console.error('Get pending payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Lấy payments theo user ID
   */
  async getByUserId(userId, filters = {}) {
    try {
      const { status, page = 1, limit = 10 } = filters;
      const offset = (page - 1) * limit;

      const pool = await poolPromise;
      
      let query = `
        SELECT 
          p.*,
          o.id as order_id,
          o.total_price as order_total,
          o.status as order_status
        FROM payments p
        INNER JOIN orders o ON p.order_id = o.id
        WHERE o.user_id = @userId
      `;

      if (status) {
        query += ` AND p.status = @status`;
      }

      query += ` ORDER BY p.created_at DESC
                 OFFSET @offset ROWS
                 FETCH NEXT @limit ROWS ONLY`;

      const request = pool.request()
        .input('userId', sql.Int, userId)
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, limit);

      if (status) {
        request.input('status', sql.NVarChar, status);
      }

      const result = await request.query(query);

      // Đếm tổng số
      let countQuery = `
        SELECT COUNT(*) as total
        FROM payments p
        INNER JOIN orders o ON p.order_id = o.id
        WHERE o.user_id = @userId
      `;

      if (status) {
        countQuery += ` AND p.status = @status`;
      }

      const countRequest = pool.request().input('userId', sql.Int, userId);
      if (status) {
        countRequest.input('status', sql.NVarChar, status);
      }

      const countResult = await countRequest.query(countQuery);

      return {
        success: true,
        data: result.recordset,
        total: countResult.recordset[0].total,
        page: page,
        limit: limit
      };
    } catch (error) {
      console.error('Get user payments error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cập nhật status của payment
   */
  async updateStatus(paymentId, status, note = null) {
    try {
      const pool = await poolPromise;
      const request = pool.request()
        .input('paymentId', sql.Int, paymentId)
        .input('status', sql.NVarChar, status)
        .input('updatedAt', sql.DateTime, new Date());

      let query = `
        UPDATE payments 
        SET status = @status, 
            updated_at = @updatedAt
      `;

      if (note) {
        query += `, note = @note`;
        request.input('note', sql.NVarChar, note);
      }

      query += ` WHERE id = @paymentId`;

      await request.query(query);

      return { success: true };
    } catch (error) {
      console.error('Update payment status error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Lấy thống kê payments
   */
  async getStatistics(filters = {}) {
    try {
      const { startDate, endDate, userId } = filters;

      const pool = await poolPromise;
      let query = `
        SELECT 
          COUNT(*) as total_payments,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_payments,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_payments,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount,
          AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as average_amount
        FROM payments p
      `;

      if (userId) {
        query += ` INNER JOIN orders o ON p.order_id = o.id WHERE o.user_id = @userId`;
      } else {
        query += ` WHERE 1=1`;
      }

      if (startDate) {
        query += ` AND p.created_at >= @startDate`;
      }

      if (endDate) {
        query += ` AND p.created_at <= @endDate`;
      }

      const request = pool.request();

      if (userId) request.input('userId', sql.Int, userId);
      if (startDate) request.input('startDate', sql.DateTime, startDate);
      if (endDate) request.input('endDate', sql.DateTime, endDate);

      const result = await request.query(query);

      return {
        success: true,
        data: result.recordset[0]
      };
    } catch (error) {
      console.error('Get payment statistics error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Kiểm tra xem order đã có payment completed chưa
   */
  async hasCompletedPayment(orderId) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('orderId', sql.Int, orderId)
        .query(`
          SELECT COUNT(*) as count
          FROM payments
          WHERE order_id = @orderId AND status = 'completed'
        `);

      return result.recordset[0].count > 0;
    } catch (error) {
      console.error('Check completed payment error:', error);
      return false;
    }
  }
}

module.exports = new PaymentModel();