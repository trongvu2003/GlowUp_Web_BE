
-- 1. Tạo bảng payments
CREATE TABLE dbo.payments (
  id INT IDENTITY(1,1) PRIMARY KEY,
  order_id INT NOT NULL,
  payment_method NVARCHAR(50) NOT NULL, -- 'vnpay', 'cod', 'momo', etc.
  amount DECIMAL(12,0) NOT NULL,
  status NVARCHAR(30) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  
  -- Thông tin từ VNPay
  transaction_no NVARCHAR(100) NULL, -- Mã giao dịch VNPay
  bank_code NVARCHAR(50) NULL, -- Mã ngân hàng
  bank_tran_no NVARCHAR(100) NULL, -- Mã giao dịch ngân hàng
  card_type NVARCHAR(50) NULL, -- Loại thẻ: ATM, QRCODE
  pay_date NVARCHAR(50) NULL, -- Ngày thanh toán (yyyyMMddHHmmss)
  
  -- Response từ VNPay
  response_code NVARCHAR(10) NULL, -- '00' = success
  response_message NVARCHAR(255) NULL,
  
  -- Timestamps
  created_at DATETIME DEFAULT GETDATE(),
  completed_at DATETIME NULL,
  
  -- Foreign key
  CONSTRAINT FK_payments_orders FOREIGN KEY(order_id) REFERENCES dbo.orders(id)
);
GO

-- 2. Tạo indexes
CREATE INDEX idx_payments_order_id ON dbo.payments(order_id);
CREATE INDEX idx_payments_transaction_no ON dbo.payments(transaction_no);
CREATE INDEX idx_payments_status ON dbo.payments(status);
CREATE INDEX idx_payments_created_at ON dbo.payments(created_at);
GO

-- 3. Thêm cột payment_status cho bảng orders (để tracking tổng quát)
ALTER TABLE dbo.orders
ADD payment_status NVARCHAR(30) DEFAULT 'unpaid'; -- 'unpaid', 'paid'
GO

-- Cập nhật giá trị mặc định cho orders hiện có
UPDATE dbo.orders
SET payment_status = 'unpaid'
WHERE payment_status IS NULL;
GO

-- 4. Xem cấu trúc bảng payments
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dbo' 
  AND TABLE_NAME = 'payments'
ORDER BY ORDINAL_POSITION;
GO



CREATE VIEW vw_orders_with_payments AS
SELECT 
    o.id AS order_id,
    o.user_id,
    o.total_price,
    o.status AS order_status,

    p.id AS payment_id,
    p.amount AS payment_amount,
    p.status AS payment_status,
    p.created_at AS payment_created_at
FROM orders o
LEFT JOIN payments p ON o.id = p.order_id;
