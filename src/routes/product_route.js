const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  getProductById,
  CreateProduct,
  UpdateProduct,
  DeleteProduct,
} = require("../controllers/product_controller");
const upload = require("../middlewares/upload");
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.post("/create", upload.array("images", 5), CreateProduct);
router.put("/update/:id", upload.array("images", 5), UpdateProduct);
router.delete("/delete/:id", DeleteProduct);

module.exports = router;
