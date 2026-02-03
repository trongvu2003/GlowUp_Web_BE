const { sql, poolPromise } = require('../config/db');
const vnpayService = require('../services/vnpay_service');

class VNPayController {
  /**
   * Tạo payment record và URL thanh toán VNPay
   */
  async createPayment(req, res) {
    console.log("✅✅✅ CONTROLLER createPayment CALLED!");
  console.log("📦 Request Body:", req.body);
  console.log("📍 Request URL:", req.url);
  console.log("📍 Request Method:", req.method);
    try {
      const { orderId, bankCode } = req.body;

      // Lấy IP của client
      let ipAddr =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket.remoteAddress ||
      req.connection.remoteAddress ||
      '';

    // Normalize IPv6
    if (ipAddr.startsWith('::ffff:')) {
      ipAddr = ipAddr.replace('::ffff:', '');
    }

    // 🔥 FIX: Chuyển localhost IPv6 sang IPv4
    if (ipAddr === '::1') {
      ipAddr = '127.0.0.1';
    }


console.log('VNPay IP:', ipAddr);


      const pool = await poolPromise;
      
      // Kiểm tra đơn hàng có tồn tại không
      const orderResult = await pool.request()
        .input('orderId', sql.Int, orderId)
        .query('SELECT * FROM orders WHERE id = @orderId');

      if (orderResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Đơn hàng không tồn tại'
        });
      }

      const order = orderResult.recordset[0];

      // Kiểm tra trạng thái đơn hàng
      if (order.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Đơn hàng này không thể thanh toán'
        });
      }

      

      // Tạo payment record (KHÔNG dùng stored procedure)
        const paymentResult = await pool.request()
        .input('order_id', sql.Int, orderId)
        .input('payment_method', sql.NVarChar, 'vnpay')
        .input('amount', sql.Decimal(12, 0), order.total_price)
        .query(`
            INSERT INTO payments (order_id, payment_method, amount, status)
            OUTPUT INSERTED.id
            VALUES (@order_id, @payment_method, @amount, 'pending')
        `);

        const paymentId = paymentResult.recordset[0].id;


      // Tạo payment URL
      const paymentUrl = vnpayService.createPaymentUrl(
  paymentId,
  orderId,
  order.total_price,
  `PaymentOrder${orderId}`, // ✅ Đổi sang tiếng Anh, bỏ dấu
  ipAddr,
  'vn',
  bankCode || ''
);

      return res.json({
        success: true,
        data: {
          paymentId: paymentId,
          orderId: orderId,
          amount: order.total_price,
          paymentUrl: paymentUrl
        }
      });

    } catch (error) {
      console.error('Create payment error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo thanh toán',
        error: error.message
      });
    }
  }

  /**
   * Xử lý callback từ VNPay (Return URL)
   */
  async vnpayReturn(req, res) {
    console.log('\n🎯🎯🎯 VNPAY RETURN ENDPOINT CALLED 🎯🎯🎯');
  console.log('📍 Full URL:', req.originalUrl);
  console.log('📍 Query String:', JSON.stringify(req.query, null, 2));
    try {
      const vnpParams = req.query;

      // Xác thực chữ ký
      const verifyResult = vnpayService.verifyReturnUrl(vnpParams);

      if (!verifyResult.isValid) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=Invalid signature`);
      }

      const pool = await poolPromise;
      const paymentId = verifyResult.paymentId;
      const responseCode = verifyResult.responseCode;

      // Lấy thông tin payment và order
      const paymentResult = await pool.request()
        .input('paymentId', sql.Int, paymentId)
        .query(`
          SELECT p.*, o.id as order_id, o.total_price
          FROM payments p
          INNER JOIN orders o ON p.order_id = o.id
          WHERE p.id = @paymentId
        `);

      if (paymentResult.recordset.length === 0) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=Payment not found`);
      }

      const payment = paymentResult.recordset[0];
      const orderId = payment.order_id;

      // Kiểm tra response code
      if (responseCode === '00') {
        // Giao dịch thành công - sử dụng stored procedure
        await pool.request()
          .input('payment_id', sql.Int, paymentId)
          .input('transaction_no', sql.NVarChar, verifyResult.transactionNo)
          .input('bank_code', sql.NVarChar, verifyResult.bankCode)
          .input('bank_tran_no', sql.NVarChar, verifyResult.bankTranNo)
          .input('card_type', sql.NVarChar, verifyResult.cardType)
          .input('pay_date', sql.NVarChar, verifyResult.payDate)
          .input('payment_data', sql.NVarChar, JSON.stringify(verifyResult.rawData))
          .execute('sp_complete_payment');

        // Redirect về trang thành công
        return res.redirect(`${process.env.FRONTEND_URL}/payment/success?orderId=${orderId}&paymentId=${paymentId}`);
      } else {
        // Giao dịch thất bại - sử dụng stored procedure
        const message = vnpayService.getResponseDescription(responseCode);
        
        await pool.request()
          .input('payment_id', sql.Int, paymentId)
          .input('response_code', sql.NVarChar, responseCode)
          .input('response_message', sql.NVarChar, message)
          .execute('sp_fail_payment');

        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?orderId=${orderId}&message=${encodeURIComponent(message)}`);
      }

    } catch (error) {
      console.error('VNPay return error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?message=System error`);
    }
  }

  /**
   * Xử lý IPN (Instant Payment Notification) từ VNPay
   */
  async vnpayIPN(req, res) {
    try {
      const vnpParams = req.query;

      // Xác thực IPN
      const verifyResult = vnpayService.verifyIpn(vnpParams);

      // Nếu chữ ký không hợp lệ
      if (verifyResult.RspCode !== '00') {
        return res.json(verifyResult);
      }

      const pool = await poolPromise;
      const paymentId = verifyResult.paymentId;

      // Lấy thông tin payment
      const paymentResult = await pool.request()
        .input('paymentId', sql.Int, paymentId)
        .query(`
          SELECT p.*, o.total_price as order_total
          FROM payments p
          INNER JOIN orders o ON p.order_id = o.id
          WHERE p.id = @paymentId
        `);

      if (paymentResult.recordset.length === 0) {
        return res.json({
          RspCode: '01',
          Message: 'Payment not found'
        });
      }

      const payment = paymentResult.recordset[0];

      // Kiểm tra số tiền
      if (payment.amount !== verifyResult.amount) {
        return res.json({
          RspCode: '04',
          Message: 'Amount mismatch'
        });
      }

      // Kiểm tra trạng thái payment
      if (payment.status === 'completed') {
        return res.json({
          RspCode: '02',
          Message: 'Payment already confirmed'
        });
      }

      // Cập nhật payment thành công
      await pool.request()
        .input('payment_id', sql.Int, paymentId)
        .input('transaction_no', sql.NVarChar, verifyResult.transactionNo)
        .input('bank_code', sql.NVarChar, verifyResult.bankCode)
        .input('bank_tran_no', sql.NVarChar, verifyResult.bankTranNo)
        .input('card_type', sql.NVarChar, verifyResult.cardType)
        .input('pay_date', sql.NVarChar, verifyResult.payDate)
        .input('payment_data', sql.NVarChar, JSON.stringify(verifyResult.rawData))
        .execute('sp_complete_payment');

      // Trả về success cho VNPay
      return res.json({
        RspCode: '00',
        Message: 'Success'
      });

    } catch (error) {
      console.error('VNPay IPN error:', error);
      return res.json({
        RspCode: '99',
        Message: 'System error'
      });
    }
  }

  /**
   * Kiểm tra trạng thái thanh toán của đơn hàng
   */
  async checkPaymentStatus(req, res) {
    try {
      const { orderId } = req.params;

      const pool = await poolPromise;
      const result = await pool.request()
        .input('orderId', sql.Int, orderId)
        .query(`
          SELECT * FROM vw_orders_with_payments
          WHERE order_id = @orderId
          ORDER BY payment_created_at DESC
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Đơn hàng không tồn tại'
        });
      }

      return res.json({
        success: true,
        data: {
          order: {
            id: result.recordset[0].order_id,
            total: result.recordset[0].order_total,
            status: result.recordset[0].order_status,
            payment_status: result.recordset[0].payment_status,
            created_at: result.recordset[0].order_created_at
          },
          payments: result.recordset.map(p => ({
            id: p.payment_id,
            method: p.payment_method,
            amount: p.payment_amount,
            status: p.payment_status_detail,
            transaction_no: p.transaction_no,
            bank_code: p.bank_code,
            response_code: p.response_code,
            created_at: p.payment_created_at,
            completed_at: p.payment_completed_at
          }))
        }
      });

    } catch (error) {
      console.error('Check payment status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi kiểm tra trạng thái thanh toán',
        error: error.message
      });
    }
  }

  /**
   * Lấy chi tiết payment
   */
  async getPaymentDetails(req, res) {
    try {
      const { paymentId } = req.params;

      const pool = await poolPromise;
      const result = await pool.request()
        .input('paymentId', sql.Int, paymentId)
        .query(`
          SELECT 
            p.*,
            o.id as order_id,
            o.user_id,
            o.total_price as order_total,
            o.status as order_status
          FROM payments p
          INNER JOIN orders o ON p.order_id = o.id
          WHERE p.id = @paymentId
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment không tồn tại'
        });
      }

      const payment = result.recordset[0];

      return res.json({
        success: true,
        data: {
          payment: {
            id: payment.id,
            order_id: payment.order_id,
            method: payment.payment_method,
            amount: payment.amount,
            status: payment.status,
            transaction_no: payment.transaction_no,
            bank_code: payment.bank_code,
            bank_tran_no: payment.bank_tran_no,
            card_type: payment.card_type,
            pay_date: payment.pay_date,
            response_code: payment.response_code,
            response_message: payment.response_message,
            note: payment.note,
            created_at: payment.created_at,
            updated_at: payment.updated_at,
            completed_at: payment.completed_at
          },
          order: {
            id: payment.order_id,
            user_id: payment.user_id,
            total: payment.order_total,
            status: payment.order_status
          }
        }
      });

    } catch (error) {
      console.error('Get payment details error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin payment',
        error: error.message
      });
    }
  }

  /**
   * Lấy danh sách payments của user
   */
  async getUserPayments(req, res) {
    try {
      const { userId } = req.params;
      const { status, page = 1, limit = 10 } = req.query;

      const pool = await poolPromise;
      const offset = (page - 1) * limit;

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
        .input('limit', sql.Int, parseInt(limit));

      if (status) {
        request.input('status', sql.NVarChar, status);
      }

      const result = await request.query(query);

      // Đếm tổng số records
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
      const total = countResult.recordset[0].total;

      return res.json({
        success: true,
        data: {
          payments: result.recordset,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get user payments error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách payments',
        error: error.message
      });
    }
  }
}

module.exports = new VNPayController();
