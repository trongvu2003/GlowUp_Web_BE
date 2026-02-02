CREATE TABLE shipping_providers (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(100) NOT NULL,
  code NVARCHAR(50) UNIQUE NOT NULL,
  logo NVARCHAR(500),
  contact_phone NVARCHAR(20),
  contact_email NVARCHAR(100),
  base_fee DECIMAL(12,2) DEFAULT 0,
  is_active BIT DEFAULT 1,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE shipping_methods (
  id INT IDENTITY(1,1) PRIMARY KEY,
  provider_id INT,
  name NVARCHAR(100) NOT NULL,
  code NVARCHAR(50) NOT NULL,
  description NVARCHAR(500),
  estimated_days_min INT,
  estimated_days_max INT,
  fee_per_km DECIMAL(12,2),
  is_active BIT DEFAULT 1,
  created_at DATETIME DEFAULT GETDATE(),
  CONSTRAINT FK_shipping_methods_providers 
    FOREIGN KEY(provider_id) REFERENCES shipping_providers(id)
);

CREATE INDEX idx_shipping_methods_provider ON shipping_methods(provider_id);
-- Thêm các cột vận chuyển vào bảng orders
ALTER TABLE orders ADD shipping_provider_id INT;
ALTER TABLE orders ADD shipping_method_id INT;
ALTER TABLE orders ADD shipping_code NVARCHAR(100); -- Mã vận đơn
ALTER TABLE orders ADD shipping_status NVARCHAR(50) DEFAULT 'pending';
ALTER TABLE orders ADD estimated_delivery_date DATETIME;
ALTER TABLE orders ADD actual_delivery_date DATETIME;
ALTER TABLE orders ADD shipping_note NVARCHAR(500);

-- Foreign keys
ALTER TABLE orders
ADD CONSTRAINT FK_orders_shipping_providers 
  FOREIGN KEY(shipping_provider_id) REFERENCES shipping_providers(id);

ALTER TABLE orders
ADD CONSTRAINT FK_orders_shipping_methods 
  FOREIGN KEY(shipping_method_id) REFERENCES shipping_methods(id);

-- Indexes
CREATE INDEX idx_orders_shipping_status ON orders(shipping_status);
CREATE INDEX idx_orders_shipping_code ON orders(shipping_code);
CREATE TABLE shipping_trackings (
  id INT IDENTITY(1,1) PRIMARY KEY,
  order_id INT NOT NULL,
  status NVARCHAR(50) NOT NULL,
  location NVARCHAR(200),
  description NVARCHAR(500),
  updated_by INT, -- Admin/Driver ID
  created_at DATETIME DEFAULT GETDATE(),
  CONSTRAINT FK_shipping_trackings_orders 
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX idx_shipping_trackings_order ON shipping_trackings(order_id);
INSERT INTO shipping_providers (name, code, base_fee, is_active)
VALUES 
  (N'Giao hàng nhanh', 'GHN', 15000, 1),
  (N'Giao hàng tiết kiệm', 'GHTK', 12000, 1),
  (N'J&T Express', 'JT', 14000, 1),
  (N'Viettel Post', 'VTP', 16000, 1);

INSERT INTO shipping_methods (provider_id, name, code, estimated_days_min, estimated_days_max, is_active)
VALUES 
  (1, N'Giao hàng nhanh', 'EXPRESS', 1, 2, 1),
  (1, N'Giao hàng tiêu chuẩn', 'STANDARD', 3, 5, 1),
  (2, N'Giao hàng tiết kiệm', 'ECONOMY', 5, 7, 1);

