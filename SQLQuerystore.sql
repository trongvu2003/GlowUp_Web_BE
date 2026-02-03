CREATE TABLE stores (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(200) NOT NULL,
  address_detail NVARCHAR(500) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone NVARCHAR(20),
  email NVARCHAR(150),
  manager_id INT,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE(),
  
  CONSTRAINT FK_stores_manager 
    FOREIGN KEY(manager_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_stores_manager ON stores(manager_id);
CREATE INDEX idx_stores_location ON stores(latitude, longitude);