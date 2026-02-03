const { sql, poolPromise } = require("../config/db");

class AddressModel {

    /**
     * Lấy danh sách địa chỉ của user
     * Có sắp xếp: Địa chỉ mặc định lên đầu
     */
    static async getAll(userId) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('user_id', sql.Int, userId)
                .query(`
                    SELECT * FROM user_addresses 
                    WHERE user_id = @user_id
                    ORDER BY is_default DESC, created_at DESC
                `);
            return result.recordset;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy chi tiết 1 địa chỉ (Kiểm tra đúng chủ sở hữu)
     */
    static async getById(id, userId) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('user_id', sql.Int, userId)
                .query(`
                    SELECT * FROM user_addresses 
                    WHERE id = @id AND user_id = @user_id
                `);
            return result.recordset[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Thêm mới địa chỉ
     */
    static async create(data) {
        try {
            const pool = await poolPromise;
            
            // Logic: Nếu địa chỉ mới là mặc định (is_default = 1), 
            // phải reset các địa chỉ cũ của user này về 0 trước.
            if (data.is_default) {
                await pool.request()
                    .input('user_id', sql.Int, data.user_id)
                    .query(`UPDATE user_addresses SET is_default = 0 WHERE user_id = @user_id`);
            }

            const result = await pool.request()
                .input('user_id', sql.Int, data.user_id)
                .input('contact_name', sql.NVarChar(100), data.contact_name)
                .input('phone', sql.NVarChar(20), data.phone)
                .input('address_type', sql.NVarChar(50), data.address_type || 'Nhà riêng')
                .input('detail_address', sql.NVarChar(255), data.detail_address)
                .input('latitude', sql.Decimal(9, 6), data.latitude || null)
                .input('longitude', sql.Decimal(9, 6), data.longitude || null)
                .input('is_default', sql.Bit, data.is_default ? 1 : 0)
                .query(`
                    INSERT INTO user_addresses 
                    (user_id, contact_name, phone, address_type, detail_address, latitude, longitude, is_default)
                    OUTPUT INSERTED.* VALUES 
                    (@user_id, @contact_name, @phone, @address_type, @detail_address, @latitude, @longitude, @is_default)
                `);

            return result.recordset[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Cập nhật địa chỉ
     */
    static async update(id, userId, data) {
        try {
            const pool = await poolPromise;

            // Logic: Nếu update thành mặc định, reset các cái khác
            if (data.is_default) {
                await pool.request()
                    .input('user_id', sql.Int, userId)
                    .query(`UPDATE user_addresses SET is_default = 0 WHERE user_id = @user_id`);
            }

            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('user_id', sql.Int, userId) // Xác thực người dùng sở hữu địa chỉ
                .input('contact_name', sql.NVarChar(100), data.contact_name)
                .input('phone', sql.NVarChar(20), data.phone)
                .input('address_type', sql.NVarChar(50), data.address_type)
                .input('detail_address', sql.NVarChar(255), data.detail_address)
                .input('latitude', sql.Decimal(9, 6), data.latitude || null)
                .input('longitude', sql.Decimal(9, 6), data.longitude || null)
                .input('is_default', sql.Bit, data.is_default ? 1 : 0)
                .query(`
                    UPDATE user_addresses
                    SET 
                        contact_name = @contact_name,
                        phone = @phone,
                        address_type = @address_type,
                        detail_address = @detail_address,
                        latitude = @latitude,
                        longitude = @longitude,
                        is_default = @is_default
                    WHERE id = @id AND user_id = @user_id;

                    -- Trả về dữ liệu sau khi update
                    SELECT * FROM user_addresses WHERE id = @id;
                `);

            return result.recordset[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Xóa địa chỉ
     */
    static async delete(id, userId) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('user_id', sql.Int, userId) // Chỉ xóa nếu đúng là của user đó
                .query(`
                    DELETE FROM user_addresses 
                    WHERE id = @id AND user_id = @user_id
                `);
            
            // rowsAffected trả về mảng, phần tử đầu tiên là số dòng bị ảnh hưởng
            return result.rowsAffected[0] > 0;
        } catch (error) {
            throw error;
        }
    }
    
    /**
     * Hàm phụ: Đặt 1 địa chỉ làm mặc định nhanh
     */
    static async setDefault(id, userId) {
        try {
            const pool = await poolPromise;
            // Transaction: Reset tất cả về 0, sau đó set cái được chọn về 1
            const transaction = pool.transaction();
            await transaction.begin();

            try {
                const request = new sql.Request(transaction);
                
                // 1. Reset tất cả của user này về 0
                await request.input('user_id', sql.Int, userId)
                             .query(`UPDATE user_addresses SET is_default = 0 WHERE user_id = @user_id`);

                // 2. Set cái ID cụ thể thành 1
                await request.input('id', sql.Int, id)
                             .query(`UPDATE user_addresses SET is_default = 1 WHERE id = @id AND user_id = @user_id`);

                await transaction.commit();
                return true;
            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } catch (error) {
            throw error;
        }
    }
}

module.exports = AddressModel;