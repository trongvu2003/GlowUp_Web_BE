const ProductModel = require("../models/product_model");

class ProductService {
  static getAll() {
    return ProductModel.getAll();
  }

  static getById(id) {
    return ProductModel.getById(id);
  }

  static create(data) {
    return ProductModel.create(data);
  }

  static update(id, data) {
    return ProductModel.update(id, data);
  }
  static delete(id) {
    return ProductModel.delete(id);
  }

  static getByCategoryId(categoryId) {
    return ProductModel.getByCategoryId(categoryId);
  }

  static getUnassigned() {
    return ProductModel.getUnassigned();
  }

  static assignToCategory(categoryId, productIds) {
    return ProductModel.assignToCategory(categoryId, productIds);
  }

  static removeFromCategory(categoryId, productId) {
    return ProductModel.removeFromCategory(categoryId, productId);
  }
}

module.exports = ProductService;
