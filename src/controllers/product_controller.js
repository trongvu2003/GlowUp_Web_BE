const ProductService = require("../services/product_service");

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
  await ProductService.update(req.params.id, req.body);
  res.json({ message: "update success" });
};

const DeleteProduct = async (req, res) => {
  await ProductService.delete(req.params.id);
  res.json({ message: "delete success" });
};

module.exports = {
  getAllProducts,
  getProductById,
  CreateProduct,
  UpdateProduct,
  DeleteProduct,
};
