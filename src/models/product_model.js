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
      .input("price", sql.Decimal(12, 0), data.price)
      .input("quantity", sql.Int, data.quantity)
      .input("description", sql.NVarChar, data.description)
      .input("images", sql.NVarChar, JSON.stringify(data.images || []))
      .input("category_id", sql.Int, data.category_id).query(`
      INSERT INTO products
      (name, brand, gender, price, quantity, description, images, category_id)
      VALUES
      (@name, @brand, @gender, @price, @quantity, @description, @images, @category_id)
    `);
  }

  static async update(id, data) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("name", sql.NVarChar, data.name)
      .input("price", sql.Decimal(12, 0), data.price ?? null)
      .input("quantity", sql.Int, data.quantity)
      .input("description", sql.NVarChar, data.description)
      .input("images", sql.NVarChar, JSON.stringify(data.images || []))
      .input("category_id", sql.Int, data.category_id).query(`
      UPDATE products
      SET 
        name = @name,
        price = @price,
        quantity = @quantity,
        description = @description,
        images = @images,
        category_id = @category_id
      WHERE id = @id
    `);
  }

  static async delete(id) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM products WHERE id=@id");
  }

  // Sản phẩm thuộc 1 danh mục
  static async getByCategoryId(categoryId) {
    const pool = await poolPromise;
    const result = await pool.request().input("categoryId", sql.Int, categoryId)
      .query(`
        SELECT * FROM products
        WHERE category_id = @categoryId
      `);

    return result.recordset;
  }

  //  Sản phẩm chưa có danh mục
  static async getUnassigned() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM products
      WHERE category_id IS NULL
    `);

    return result.recordset;
  }

  //  Gán nhiều sản phẩm vào danh mục
  static async assignToCategory(categoryId, productIds) {
    if (!productIds.length) return;

    const pool = await poolPromise;
    const request = pool.request();
    request.input("categoryId", sql.Int, categoryId);

    const placeholders = productIds.map((id, index) => {
      request.input(`id${index}`, sql.Int, id);
      return `@id${index}`;
    });

    await request.query(`
      UPDATE products
      SET category_id = @categoryId
      WHERE id IN (${placeholders.join(",")})
    `);
  }

  //  Gỡ sản phẩm khỏi danh mục
  static async removeFromCategory(categoryId, productId) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("categoryId", sql.Int, categoryId)
      .input("productId", sql.Int, productId).query(`
        UPDATE products
        SET category_id = NULL
        WHERE id = @productId AND category_id = @categoryId
      `);
  }
}

module.exports = ProductModel;
