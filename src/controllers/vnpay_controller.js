const { sql, poolPromise } = require('../config/db');
const vnpayService = require('../services/vnpay_service');

class VNPayController {
  /**
   * Tạo payment record và URL thanh toán VNPay
   */
  async createPayment(req, res) {
    try {
      const { orderId, bankCode } = req.body;

      // Lấy IP của client
      const ipAddr = req.headers['x-forwarded-for'] ||
                     req.connection.remoteAddress ||
                     req.socket.remoteAddress ||
                     req.connection.socket.remoteAddress;

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
        `Thanh toán đơn hàng #${orderId}`,
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

// // VNPay Controller
// const { sql, poolPromise } = require('../config/db');
// const vnpayService = require('../services/vnpay_service');

// class VNPayController {
//   async createPayment(req, res) {
//     try {
//       const { orderId, amount, orderInfo } = req.body;

//       const ipAddr =
//         req.headers['x-forwarded-for'] ||
//         req.connection.remoteAddress ||
//         req.socket.remoteAddress;

//       const pool = await poolPromise;

//       // 1. Check order
//       const orderResult = await pool.request()
//         .input('orderId', sql.Int, orderId)
//         .query('SELECT * FROM orders WHERE id = @orderId');

//       if (orderResult.recordset.length === 0) {
//         return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
//       }

//       const order = orderResult.recordset[0];

//       if (order.status !== 'pending') {
//         return res.status(400).json({ message: 'Đơn hàng không thể thanh toán' });
//       }

//       const payAmount = amount || order.total_price;

//       // 2. Tạo payment record
//       await pool.request()
//         .input('orderId', sql.Int, orderId)
//         .input('method', sql.NVarChar, 'vnpay')
//         .input('amount', sql.Decimal(12, 0), payAmount)
//         .query(`
//           INSERT INTO payments (order_id, payment_method, amount, status)
//           VALUES (@orderId, @method, @amount, 'pending')
//         `);

//       // 3. Tạo URL VNPay
//       const paymentUrl = vnpayService.createPaymentUrl(
//         orderId,
//         payAmount,
//         orderInfo || `Thanh toán đơn hàng #${orderId}`,
//         ipAddr
//       );

//       // 4. Update order (chỉ trạng thái)
//       await pool.request()
//         .input('orderId', sql.Int, orderId)
//         .query(`
//           UPDATE orders
//           SET status = 'processing',
//               payment_status = 'unpaid'
//           WHERE id = @orderId
//         `);

//       return res.json({ paymentUrl });

//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ message: 'Create payment failed' });
//     }
//   }


//   /**
//    * Xử lý callback từ VNPay (Return URL)
//    */
//     async vnpayReturn(req, res) {
//     try {
//       const vnpParams = req.query;
//       const verify = vnpayService.verifyReturnUrl(vnpParams);

//       if (!verify.isValid) {
//         return res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
//       }

//       const pool = await poolPromise;
//       const orderId = verify.orderId;

//       if (verify.responseCode === '00') {
//         // Thành công
//         await pool.request()
//           .input('orderId', sql.Int, orderId)
//           .input('tranNo', sql.NVarChar, verify.transactionNo)
//           .input('bankCode', sql.NVarChar, verify.bankCode)
//           .input('payDate', sql.NVarChar, verify.payDate)
//           .query(`
//             UPDATE payments
//             SET status = 'completed',
//                 transaction_no = @tranNo,
//                 bank_code = @bankCode,
//                 pay_date = @payDate,
//                 response_code = '00',
//                 completed_at = GETDATE()
//             WHERE order_id = @orderId
//           `);

//         await pool.request()
//           .input('orderId', sql.Int, orderId)
//           .query(`
//             UPDATE orders
//             SET status = 'paid',
//                 payment_status = 'paid'
//             WHERE id = @orderId
//           `);

//         return res.redirect(`${process.env.FRONTEND_URL}/payment/success?orderId=${orderId}`);
//       }

//       // Thất bại
//       await pool.request()
//         .input('orderId', sql.Int, orderId)
//         .input('code', sql.NVarChar, verify.responseCode)
//         .query(`
//           UPDATE payments
//           SET status = 'failed',
//               response_code = @code
//           WHERE order_id = @orderId
//         `);

//       return res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);

//     } catch (err) {
//       console.error(err);
//       return res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
//     }
//   }

//   /**
//    * Xử lý IPN (Instant Payment Notification) từ VNPay
//    */
//     async vnpayIPN(req, res) {
//     try {
//       const verify = vnpayService.verifyIpn(req.query);

//       if (verify.RspCode !== '00') {
//         return res.json(verify);
//       }

//       const pool = await poolPromise;

//       await pool.request()
//         .input('orderId', sql.Int, verify.orderId)
//         .input('tranNo', sql.NVarChar, verify.transactionNo)
//         .query(`
//           UPDATE payments
//           SET status = 'completed',
//               transaction_no = @tranNo,
//               response_code = '00',
//               completed_at = GETDATE()
//           WHERE order_id = @orderId
//         `);

//       await pool.request()
//         .input('orderId', sql.Int, verify.orderId)
//         .query(`
//           UPDATE orders
//           SET status = 'paid',
//               payment_status = 'paid'
//           WHERE id = @orderId
//         `);

//       return res.json({ RspCode: '00', Message: 'Success' });

//     } catch (err) {
//       console.error(err);
//       return res.json({ RspCode: '99', Message: 'System error' });
//     }
//   }

//   /**
//    * Kiểm tra trạng thái thanh toán
//    */
//     async checkPaymentStatus(req, res) {
//     const { orderId } = req.params;
//     const pool = await poolPromise;

//     const result = await pool.request()
//       .input('orderId', sql.Int, orderId)
//       .query(`
//         SELECT 
//           o.id AS order_id,
//           o.status AS order_status,
//           o.payment_status,
//           p.payment_method,
//           p.amount,
//           p.status AS payment_status_detail,
//           p.transaction_no,
//           p.bank_code,
//           p.pay_date
//         FROM orders o
//         LEFT JOIN payments p ON o.id = p.order_id
//         WHERE o.id = @orderId
//       `);

//     if (!result.recordset.length) {
//       return res.status(404).json({ message: 'Order not found' });
//     }

//     res.json(result.recordset[0]);
//   }
// }

// module.exports = new VNPayController();