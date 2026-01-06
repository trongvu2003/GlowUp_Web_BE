const ProductService = require("../services/product_service");

const fs = require("fs");
const path = require("path");

const getAllProducts = async (req, res) => {
  const data = await ProductService.getAll();
  res.json(data);
};

const getProductById = async (req, res) => {
  const data = await ProductService.getById(req.params.id);
  if (!data) return res.status(404).json({ message: "Not found" });
  res.json(data);
};

const CreateProduct = async (req, res) => {
  const images = req.files.map((f) => f.filename);
  const data = { ...req.body, images };
  await ProductService.create(data);
  res.json({ message: "create success" });
};

const UpdateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, quantity, description } = req.body;

    if (!name)
      return res.status(400).json({ message: "Tên sản phẩm là bắt buộc" });

    // Lấy product cũ từ DB
    const oldProduct = await ProductService.getById(id);
    if (!oldProduct)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    // Ảnh mới upload
    const newImages = req.files ? req.files.map((f) => f.filename) : [];
    // nếu không có ảnh mới thì giữ ảnh cũ
    const images = newImages.length > 0 ? newImages : oldProduct.images;

    const data = {
      name,
      price: price ? Number(price) : 0,
      quantity: quantity ? Number(quantity) : 0,
      description: description || "",
      images,
    };

    await ProductService.update(id, data);
    res.json({ message: "Cập nhật sản phẩm thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Có lỗi server khi cập nhật sản phẩm" });
  }
};

const DeleteProduct = async (req, res) => {
  try {
    const id = req.params.id;

    // Lấy sản phẩm từ DB để biết các ảnh hiện có
    const product = await ProductService.getById(id);
    if (!product)
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });

    //  Xóa file ảnh cũ trong folder
    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => {
        const filePath = path.join(__dirname, "../uploads/products", img);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    // Xóa sản phẩm trong DB
    await ProductService.delete(id);
    res.json({ message: "Xóa sản phẩm thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Có lỗi server khi xóa sản phẩm" });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  CreateProduct,
  UpdateProduct,
  DeleteProduct,
};
