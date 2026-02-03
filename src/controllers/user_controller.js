const UserService = require("../services/user_service");

const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user?.id || null;
    console.log("REQ.USER =", req.user);

    const users = await UserService.getAll(currentUserId);

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
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

const getMe = async (req, res) => {
  try {
    // 1. Lấy thông tin từ middleware gửi sang
    // Lúc login bạn sign token thế nào thì giờ decoded ra thế ấy.
    const currentUser = req.user; 
    
    // Kiểm tra an toàn
    if (!currentUser || !currentUser.id) {
      return res.status(400).json({ message: "Token không chứa ID người dùng" });
    }

    // 2. Gọi Model để lấy dữ liệu mới nhất từ DB (vì Token có thể cũ)
    const userData = await UserService.getById(currentUser.id);

    if (!userData) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // 3. Loại bỏ mật khẩu trước khi trả về
    const { password, ...infoWithoutPassword } = userData;

    return res.status(200).json({
      success: true,
      data: infoWithoutPassword
    });

  } catch (error) {
    console.error("GetMe Error:", error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  postCreateUser,
  UpdateUser,
  DeleteUser,
  getMe
};
