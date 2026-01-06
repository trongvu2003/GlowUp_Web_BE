const { sql, poolPromise } = require("../config/db");

class ProductModel {
  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM products");
    return result.recordset.map((p) => ({
      ...p,
      images: JSON.parse(p.images || "[]"),
    }));
  }

  static async getById(id) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM products WHERE id=@id");

    if (!result.recordset[0]) return null;
    const p = result.recordset[0];
    p.images = JSON.parse(p.images || "[]");
    return p;
  }

  static async create(data) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("name", sql.NVarChar, data.name)
      .input("brand", sql.NVarChar, data.brand)
      .input("gender", sql.NVarChar, data.gender)
      .input("price", sql.Decimal, data.price)
      .input("quantity", sql.Int, data.quantity)
      .input("description", sql.NVarChar, data.description)
      .input("images", sql.NVarChar, JSON.stringify(data.images || [])).query(`
        INSERT INTO products(name,brand,gender,price,quantity,description,images)
        VALUES(@name,@brand,@gender,@price,@quantity,@description,@images)
      `);
  }

  static async update(id, data) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("name", sql.NVarChar, data.name)
      .input("price", sql.Decimal, data.price ?? null)
      .input("quantity", sql.Int, data.quantity)
      .input("description", sql.NVarChar, data.description)
      .input("images", sql.NVarChar, JSON.stringify(data.images || [])).query(`
        UPDATE products
        SET name=@name, price=@price, quantity=@quantity,
            description=@description, images=@images
        WHERE id=@id
      `);
  }

  static async delete(id) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM products WHERE id=@id");
  }
}

module.exports = ProductModel;
