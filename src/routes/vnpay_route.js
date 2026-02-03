const express = require('express');
const router = express.Router();
const vnpayController = require('../controllers/vnpay_controller');
// const authMiddleware = require('../middlewares/auth'); // Uncomment nếu cần auth

/**
 * @route   POST /api/vnpay/create-payment
 * @desc    Tạo payment record và URL thanh toán VNPay
 * @access  Private
 * @body    { orderId: number, bankCode?: string }
 */
router.post('/create-payment', vnpayController.createPayment);

/**
 * @route   GET /api/vnpay/return
 * @desc    Xử lý callback từ VNPay sau khi thanh toán
 * @access  Public
 * @note    VNPay sẽ redirect user về URL này
 */
router.get('/return', vnpayController.vnpayReturn);

/**
 * @route   GET /api/vnpay/ipn
 * @desc    Xử lý IPN (Instant Payment Notification) từ VNPay
 * @access  Public
 * @note    VNPay server sẽ gọi URL này để confirm giao dịch
 */
router.get('/ipn', vnpayController.vnpayIPN);

/**
 * @route   GET /api/vnpay/order/:orderId/payments
 * @desc    Kiểm tra trạng thái thanh toán của đơn hàng
 * @access  Private
 * @returns {order, payments[]}
 */
router.get('/order/:orderId/payments', vnpayController.checkPaymentStatus);

/**
 * @route   GET /api/vnpay/payment/:paymentId
 * @desc    Lấy chi tiết một payment
 * @access  Private
 * @returns {payment, order}
 */
router.get('/payment/:paymentId', vnpayController.getPaymentDetails);

/**
 * @route   GET /api/vnpay/user/:userId/payments
 * @desc    Lấy danh sách payments của user
 * @access  Private
 * @query   { status?: string, page?: number, limit?: number }
 * @returns {payments[], pagination}
 */
router.get('/user/:userId/payments', vnpayController.getUserPayments);

module.exports = router;