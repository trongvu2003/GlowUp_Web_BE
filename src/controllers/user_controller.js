const UserService = require("../services/user_service");

const getAllUsers = async (req, res) => {
  try {
    const users = await UserService.getAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await UserService.getById(req.params.id);
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json(user);
  } catch (err) {
    console.log("GET USER BY ID ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

const postCreateUser = async (req, res) => {
  try {
    await UserService.create(req.body);
    res.json({ message: "Create success" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const UpdateUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

  try {
    await UserService.update(id, req.body);
    res.json({ message: "Update success" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const DeleteUser = async (req, res) => {
  await UserService.delete(req.params.id);
  res.json({ message: "Delete success" });
};

module.exports = {
  getAllUsers,
  getUserById,
  postCreateUser,
  UpdateUser,
  DeleteUser,
};
