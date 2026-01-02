const sql = require("mssql");
const { poolPromise } = require("../config/db");
const bcrypt = require("bcryptjs");

class UserModel {
  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM users
    `);
    return result.recordset;
  }

  static async getById(id) {
    const pool = await poolPromise;
    const result = await pool.request().input("id", sql.Int, id).query(`
        SELECT *FROM users WHERE id = @id
      `);
    return result.recordset[0];
  }
  // Lấy user theo email check tồn tại
  static async getByEmail(email) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query(`SELECT * FROM users WHERE email=@email`);
    return result.recordset[0];
  }

  static async create(user) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("full_name", sql.NVarChar, user.full_name)
      .input("email", sql.NVarChar, user.email)
      .input("password", sql.NVarChar, user.password)
      .input("phone", sql.NVarChar, user.phone)
      .input("role", sql.NVarChar, user.role || "user").query(`
        INSERT INTO users(full_name, email, password, phone, role)
        VALUES(@full_name, @email, @password, @phone, @role)
      `);
  }

  static async update(id, user) {
    if (!id) throw new Error("User ID is required");

    const pool = await poolPromise;

    // Hash password nếu có
    let passwordHash = null;
    if (user.password) {
      passwordHash = await bcrypt.hash(user.password, 10);
    }

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("full_name", sql.NVarChar, user.full_name ?? null)
      .input("phone", sql.NVarChar, user.phone ?? null)
      .input("role", sql.NVarChar, user.role ?? null)
      .input("email", sql.NVarChar, user.email ?? null)
      .input("password", sql.NVarChar, passwordHash).query(`
        UPDATE users
        SET full_name = ISNULL(@full_name, full_name),
            phone = ISNULL(@phone, phone),
            role = ISNULL(@role, role),
            email = ISNULL(@email, email),
            password = ISNULL(@password, password)
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      throw new Error("User not found or no changes made");
    }
  }

  static async delete(id) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .query(`DELETE FROM users WHERE id=@id`);
  }
}

module.exports = UserModel;
