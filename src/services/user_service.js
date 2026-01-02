const UserModel = require("../models/user_model");
const bcrypt = require("bcryptjs");

class UserService {
  static async getAll() {
    return await UserModel.getAll();
  }

  static async getById(id) {
    return await UserModel.getById(id);
  }

  static async create(data) {
    const existed = await UserModel.getByEmail(data.email);
    if (existed) throw new Error("Email exists");

    data.password = await bcrypt.hash(data.password, 10);
    await UserModel.create(data);
  }

  static async update(id, data) {
    await UserModel.update(id, data);
  }

  static async delete(id) {
    await UserModel.delete(id);
  }
}

module.exports = UserService;
