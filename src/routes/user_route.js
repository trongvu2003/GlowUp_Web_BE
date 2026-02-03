const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  postCreateUser,
  UpdateUser,
  DeleteUser,
  getMe
} = require("../controllers/user_controller");
const auth = require("../middlewares/auth");
router.get("/me", auth, getMe);

router.get("/", auth, getAllUsers);
router.post("/create-user", postCreateUser);
router.put("/update-user/:id", UpdateUser);
router.delete("/delete-user/:id", DeleteUser);

router.get("/:id", getUserById);

module.exports = router;
