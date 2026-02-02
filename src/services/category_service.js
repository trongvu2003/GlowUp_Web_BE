const CategoryModel = require("../models/category_model");

const CategoryService = {
  getAllCategories: async () => {
    return await CategoryModel.getAll();
  },

  getCategoryById: async (id) => {
    return await CategoryModel.getById(id);
  },

  createCategory: async (data) => {
    if (!data.name) {
      throw new Error("Tên danh mục không được để trống");
    }
    return await CategoryModel.create(data);
  },

  updateCategory: async (id, data) => {
    return await CategoryModel.update(id, data);
  },

  deleteCategory: async (id) => {
    return await CategoryModel.delete(id);
  },
};

module.exports = CategoryService;
