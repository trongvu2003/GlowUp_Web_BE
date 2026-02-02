const { sql, poolPromise } = require("../config/db");

class CategoryModel {
  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM categories");
    return result;
  }

  static async getById(id) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM categories WHERE id = @id");

    return result;
  }

  static async create(data) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("name", sql.NVarChar, data.name)
      .input("description", sql.NVarChar, data.description)
      .input("image", sql.NVarChar, data.image).query(`
        INSERT INTO categories (name, description, image)
        VALUES (@name, @description, @image)
      `);
  }

  static async update(id, data) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("name", sql.NVarChar, data.name)
      .input("description", sql.NVarChar, data.description)
      .input("image", sql.NVarChar, data.image).query(`
        UPDATE categories
        SET name = @name,
            description = @description,
            image = @image
        WHERE id = @id
      `);
  }

  static async delete(id) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM categories WHERE id = @id");
  }
}

module.exports = CategoryModel;
