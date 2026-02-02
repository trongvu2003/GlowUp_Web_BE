const { sql, poolPromise } = require("../config/db");

class ShippingProviderModel{
    static async getAll(){
        try{
        const pool = await poolPromise;
        const result= await pool.request().query(`SELECT * FROM shipping_providers
            WHERE is_active=1
            ORDER BY name
            `);
            return result.recordset;
        }catch(e){
            throw e;
        }
    }

    static async getById(id){
        try{
        const pool = await poolPromise;
        const result= await pool
        .request()
        .input('id', sql.Int, id)
        .query(`SELECT * FROM shipping_providers
            WHERE is_active=1
            ORDER BY name
            `);
            return result.recordset[0];
        }catch(e){
            throw e;
        }
    }

    static async create(data){
        try{
        const pool = await poolPromise;
        const result= await pool
        .request()
        .input('name', sql.NVarChar, data.name)
        .input('code', sql.NVarChar, data.code)
        .input('logo', sql.NVarChar, data.logo)
        .input('contact_phone', sql.NVarChar, data.contact_phone)
        .input('contact_email', sql.NVarChar, data.contact_email)
        .input('base_fee', sql.Decimal(12, 2), data.base_fee)
        .query(`
          INSERT INTO shipping_providers 
          (name, code, logo, contact_phone, contact_email, base_fee)
          OUTPUT INSERTED.*
          VALUES (@name, @code, @logo, @contact_phone, @contact_email, @base_fee)
        `);
      return result.recordset[0];
    } catch (error) {
      throw error;
    }
    }

    static async update(id, data) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('name', sql.NVarChar, data.name)
        .input('base_fee', sql.Decimal(12, 2), data.base_fee)
        .input('is_active', sql.Bit, data.is_active)
        .query(`
          UPDATE shipping_providers 
          SET name = @name, 
              base_fee = @base_fee, 
              is_active = @is_active,
              updated_at = GETDATE()
          WHERE id = @id
        `);
      return result.rowsAffected[0] > 0;
    } catch (error) {
      throw error;
    }
  }
    

}
module.exports = ShippingProviderModel;