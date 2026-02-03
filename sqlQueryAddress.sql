CREATE TABLE user_addresses (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    
    contact_name NVARCHAR(100) NOT NULL, 
    phone NVARCHAR(20) NOT NULL,         
    
    -- Phân loại địa chỉ
    address_type NVARCHAR(50) DEFAULT N'Nhà riêng', 
    
    -- Địa chỉ chi tiết
    detail_address NVARCHAR(255) NOT NULL, 
    
    -- Tọa độ (Dùng DECIMAL để lưu kinh độ/vĩ độ chuẩn xác)
    latitude DECIMAL(9, 6),  
    longitude DECIMAL(9, 6), 
    
    -- Cờ đánh dấu địa chỉ mặc định (Optional)
    is_default BIT DEFAULT 0, -- 1 là mặc định, 0 là không
    
    created_at DATETIME DEFAULT GETDATE(),

    -- Thiết lập mối quan hệ khóa ngoại
    CONSTRAINT FK_UserAddresses_Users FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE 
);   