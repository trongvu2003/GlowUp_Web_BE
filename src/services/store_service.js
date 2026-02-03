const StoreModel = require('../models/store_model');

class StoreService {
  async getAllStores() {
    return await StoreModel.getAll();
  }

  async getStoreById(storeId) {
    const store = await StoreModel.getById(storeId);
    if (!store) {
      throw new Error('Không tìm thấy cửa hàng');
    }
    return store;
  }

  // ✅ Lấy stores theo manager
  async getStoresByManager(managerId) {
    return await StoreModel.getByManagerId(managerId);
  }

  async createStore(storeData) {
    // Validate
    if (!storeData.name) {
      throw new Error('Thiếu tên cửa hàng');
    }
    if (!storeData.address_detail) {
      throw new Error('Thiếu địa chỉ');
    }
    if (!storeData.latitude || !storeData.longitude) {
      throw new Error('Thiếu tọa độ GPS');
    }

    return await StoreModel.create(storeData);
  }

  async updateStore(storeId, storeData) {
    const existing = await StoreModel.getById(storeId);
    if (!existing) {
      throw new Error('Không tìm thấy cửa hàng');
    }

    return await StoreModel.update(storeId, storeData);
  }
}

module.exports = new StoreService();