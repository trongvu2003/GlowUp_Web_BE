const { sql, poolPromise } = require("../config/db");

class ShippingMethodModel {
  // Lấy methods theo provider
  static async getByProviderId(providerId) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('providerId', sql.Int, providerId)
        .query(`
          SELECT 
            sm.*,
            sp.name as provider_name,
            sp.code as provider_code
          FROM shipping_methods sm
          LEFT JOIN shipping_providers sp ON sm.provider_id = sp.id
          WHERE sm.provider_id = @providerId AND sm.is_active = 1
          ORDER BY sm.estimated_days_min
        `);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả methods
  static async getAll() {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .query(`
          SELECT 
            sm.*,
            sp.name as provider_name,
            sp.base_fee as provider_base_fee
          FROM shipping_methods sm
          LEFT JOIN shipping_providers sp ON sm.provider_id = sp.id
          WHERE sm.is_active = 1
          ORDER BY sp.name, sm.estimated_days_min
        `);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  // Tính phí vận chuyển
  static async calculateFee(methodId, distance) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('methodId', sql.Int, methodId)
        .query(`
          SELECT 
            sm.fee_per_km,
            sp.base_fee
          FROM shipping_methods sm
          LEFT JOIN shipping_providers sp ON sm.provider_id = sp.id
          WHERE sm.id = @methodId
        `);
      
      if (result.recordset.length === 0) {
        throw new Error('Shipping method not found');
      }

      const { fee_per_km, base_fee } = result.recordset[0];
      const totalFee = base_fee + (fee_per_km * distance);
      
      return Math.round(totalFee);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ShippingMethodModel;