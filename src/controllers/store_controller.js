const storeService = require('../services/store_service');

class StoreController {
  // [PUBLIC] Lấy tất cả stores
  async getAll(req, res) {
    try {
      const stores = await storeService.getAllStores();

      res.json({
        success: true,
        data: stores
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // [PUBLIC] Lấy store theo ID
  async getById(req, res) {
    try {
      const { storeId } = req.params;
      const store = await storeService.getStoreById(storeId);

      res.json({
        success: true,
        data: store
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // [MANAGER] Lấy stores của manager (auth required)
  async getMyStores(req, res) {
    try {
      const managerId = req.user.id; // Từ middleware authenticateToken

      const stores = await storeService.getStoresByManager(managerId);

      res.json({
        success: true,
        data: stores
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // [ADMIN] Tạo store
  async create(req, res) {
    try {
      const storeData = req.body;
      const newStore = await storeService.createStore(storeData);

      res.status(201).json({
        success: true,
        message: 'Tạo cửa hàng thành công',
        data: newStore
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // [ADMIN] Cập nhật store
  async update(req, res) {
    try {
      const { storeId } = req.params;
      const storeData = req.body;

      const updated = await storeService.updateStore(storeId, storeData);

      res.json({
        success: true,
        message: 'Cập nhật cửa hàng thành công',
        data: updated
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new StoreController();