const { sql, poolPromise } = require("../config/db");

class StoreModel {
  // Lấy tất cả stores
  static async getAll() {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .query(`
          SELECT 
            s.*,
            u.full_name as manager_name,
            u.email as manager_email_full
          FROM stores s
          LEFT JOIN users u ON s.manager_id = u.id
          ORDER BY s.name
        `);
      return result.recordset;
    } catch (error) {
      throw new Error('Lỗi khi lấy danh sách cửa hàng: ' + error.message);
    }
  }

  // Lấy store theo ID
  static async getById(storeId) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('storeId', sql.Int, storeId)
        .query(`
          SELECT 
            s.*,
            u.full_name as manager_name,
            u.email as manager_email_full
          FROM stores s
          LEFT JOIN users u ON s.manager_id = u.id
          WHERE s.id = @storeId
        `);
      return result.recordset[0];
    } catch (error) {
      throw new Error('Lỗi khi lấy cửa hàng: ' + error.message);
    }
  }

  // Lấy stores theo manager_id
  static async getByManagerId(managerId) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('managerId', sql.Int, managerId)
        .query(`
          SELECT 
            s.*,
            u.full_name as manager_name,
            u.email as manager_email_full
          FROM stores s
          LEFT JOIN users u ON s.manager_id = u.id
          WHERE s.manager_id = @managerId
          ORDER BY s.name
        `);
      return result.recordset; 
    } catch (error) {
      throw new Error('Lỗi khi lấy cửa hàng theo manager: ' + error.message);
    }
  }

  // Tạo store mới
  static async create(data) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('name', sql.NVarChar, data.name)
        .input('address_detail', sql.NVarChar, data.address_detail)
        .input('latitude', sql.Decimal(10, 8), data.latitude)
        .input('longitude', sql.Decimal(11, 8), data.longitude)
        .input('phone', sql.NVarChar, data.phone)
        .input('email', sql.NVarChar, data.email)
        .input('manager_id', sql.Int, data.manager_id)
        .query(`
          INSERT INTO stores 
          (name, address_detail, latitude, longitude, phone, email, manager_id)
          OUTPUT INSERTED.*
          VALUES (@name, @address_detail, @latitude, @longitude, @phone, @email, @manager_id)
        `);
      
      return result.recordset[0];
    } catch (error) {
      throw new Error('Lỗi khi tạo cửa hàng: ' + error.message);
    }
  }

  // Cập nhật store
  static async update(storeId, data) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('storeId', sql.Int, storeId)
        .input('name', sql.NVarChar, data.name)
        .input('address_detail', sql.NVarChar, data.address_detail)
        .input('latitude', sql.Decimal(10, 8), data.latitude)
        .input('longitude', sql.Decimal(11, 8), data.longitude)
        .input('phone', sql.NVarChar, data.phone)
        .input('email', sql.NVarChar, data.email)
        .input('manager_id', sql.Int, data.manager_id)
        .query(`
          UPDATE stores 
          SET 
            name = @name,
            address_detail = @address_detail,
            latitude = @latitude,
            longitude = @longitude,
            phone = @phone,
            email = @email,
            manager_id = @manager_id,
            updated_at = GETDATE()
          OUTPUT INSERTED.*
          WHERE id = @storeId
        `);
      
      return result.recordset[0];
    } catch (error) {
      throw new Error('Lỗi khi cập nhật cửa hàng: ' + error.message);
    }
  }
}

module.exports = StoreModel;