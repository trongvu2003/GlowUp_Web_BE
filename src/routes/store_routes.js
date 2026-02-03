const express = require('express');
const router = express.Router();
const storeController = require('../controllers/store_controller');
const auth = require("../middlewares/auth");

// ============= PUBLIC ROUTES =============
// Lấy tất cả stores
router.get('/', storeController.getAll);
// ============= MANAGER ROUTES =============
router.get('/my-stores', auth, storeController.getMyStores);
// Lấy store theo ID
router.get('/:storeId', storeController.getById);



// ============= ADMIN ROUTES =============
// Tạo store mới
router.post('/', storeController.create);

// Cập nhật store
router.put('/:storeId', storeController.update);

module.exports = router;