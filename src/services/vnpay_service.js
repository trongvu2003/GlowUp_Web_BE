//services/vnpay_service.js
const crypto = require('crypto');

function formatDate(date) {
  const pad = (n) => (n < 10 ? '0' + n : n);
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

class VNPayService {
  constructor() {
  this.vnp_TmnCode = process.env.VNP_TMN_CODE;
  this.vnp_HashSecret = process.env.VNP_HASH_SECRET;
  this.vnp_Url = process.env.VNP_URL;
  this.vnp_ReturnUrl = process.env.VNP_RETURN_URL;

  console.log('🏢 VNP_TMN_CODE:', this.vnp_TmnCode);
  console.log('🔑 VNP_HASH_SECRET length:', this.vnp_HashSecret?.length);
  console.log('🔑 VNP_HASH_SECRET:', this.vnp_HashSecret);
}

  sortObject(obj) {
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = obj[key];
        return acc;
      }, {});
  }

  createPaymentUrl(paymentId, orderId, amount, orderInfo, ipAddr, locale = 'vn', bankCode = '') {
  const date = new Date();
  const createDate = formatDate(date);
  const expireDate = formatDate(new Date(date.getTime() + 15 * 60 * 1000));

  let vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: this.vnp_TmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: 'VND',
    vnp_TxnRef: paymentId.toString(),
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: amount * 100,
    vnp_ReturnUrl: this.vnp_ReturnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate
  };

  if (bankCode) {
    vnp_Params.vnp_BankCode = bankCode;
  }

  vnp_Params = this.sortObject(vnp_Params);

  console.log('🔹 Sorted Params:', JSON.stringify(vnp_Params, null, 2));

  // ✅ ENCODE khi tạo signData
  const signData = Object.keys(vnp_Params)
    .map(key => `${key}=${encodeURIComponent(vnp_Params[key])}`)
    .join('&');

  console.log('📝 CREATE SignData:', signData);

  const signed = crypto
    .createHmac('sha512', this.vnp_HashSecret)
    .update(signData, 'utf8')
    .digest('hex');

  console.log('🔐 CREATE Signature:', signed);

  vnp_Params.vnp_SecureHash = signed;

  const paymentUrl =
    this.vnp_Url +
    '?' +
    Object.keys(vnp_Params)
      .map(key => `${key}=${encodeURIComponent(vnp_Params[key])}`)
      .join('&');

  return paymentUrl;
}
  verifyReturnUrl(vnpParams) {
  console.log('\n=== VNPAY RETURN VERIFY ===');
  console.log('📥 Full params from VNPay:', JSON.stringify(vnpParams, null, 2));
  
  const secureHash = vnpParams.vnp_SecureHash;
  console.log('🔐 VNPay SecureHash:', secureHash);

  delete vnpParams.vnp_SecureHash;
  delete vnpParams.vnp_SecureHashType;

  const sortedParams = this.sortObject(vnpParams);
  
  console.log('🔹 Sorted params for verify:', JSON.stringify(sortedParams, null, 2));

  const signData = Object.keys(sortedParams)
    .map(key => `${key}=${sortedParams[key]}`)
    .join('&');

  console.log('📝 VERIFY SignData:', signData);

  const signed = crypto
    .createHmac('sha512', this.vnp_HashSecret)
    .update(signData, 'utf8')
    .digest('hex');

  console.log('🔐 Our Signature:', signed);
  console.log('🔐 VNPay Signature:', secureHash);
  console.log('✅ Match:', secureHash === signed);
  console.log('=== END VERIFY ===\n');

  if (secureHash === signed) {
    return {
      isValid: true,
      paymentId: sortedParams.vnp_TxnRef,
      amount: sortedParams.vnp_Amount / 100,
      responseCode: sortedParams.vnp_ResponseCode,
      transactionNo: sortedParams.vnp_TransactionNo,
      bankCode: sortedParams.vnp_BankCode,
      bankTranNo: sortedParams.vnp_BankTranNo,
      cardType: sortedParams.vnp_CardType,
      payDate: sortedParams.vnp_PayDate,
      rawData: sortedParams
    };
  }

  return { isValid: false };
}
  verifyIpn(vnpParams) {
    const secureHash = vnpParams.vnp_SecureHash;
    const responseCode = vnpParams.vnp_ResponseCode;

    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    const sortedParams = this.sortObject(vnpParams);

    const signData = Object.keys(sortedParams)
      .map(key => `${key}=${sortedParams[key]}`)
      .join('&');

    const signed = crypto
      .createHmac('sha512', this.vnp_HashSecret)
      .update(signData, 'utf8')
      .digest('hex');

    if (secureHash !== signed) {
      return {
        RspCode: '97',
        Message: 'Invalid signature'
      };
    }

    if (responseCode === '00') {
      return {
        RspCode: '00',
        Message: 'Success',
        paymentId: sortedParams.vnp_TxnRef,
        amount: sortedParams.vnp_Amount / 100,
        transactionNo: sortedParams.vnp_TransactionNo,
        bankCode: sortedParams.vnp_BankCode,
        bankTranNo: sortedParams.vnp_BankTranNo,
        cardType: sortedParams.vnp_CardType,
        payDate: sortedParams.vnp_PayDate,
        rawData: sortedParams
      };
    }

    return {
      RspCode: responseCode,
      Message: 'Transaction failed',
      paymentId: sortedParams.vnp_TxnRef
    };
  }

  /**
   * Lấy mô tả response code
   */
  getResponseDescription(code) {
    const messages = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ',
      '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
      '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Đã hết hạn chờ thanh toán',
      '12': 'Thẻ/Tài khoản bị khóa',
      '13': 'Sai mật khẩu xác thực giao dịch (OTP)',
      '24': 'Khách hàng hủy giao dịch',
      '51': 'Tài khoản không đủ số dư',
      '65': 'Tài khoản vượt quá hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định',
      '99': 'Lỗi không xác định'
    };

    return messages[code] || 'Lỗi không xác định';
  }
}

module.exports = new VNPayService();
