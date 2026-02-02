const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shipping_controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

// Public routes
router.get('/providers', shippingController.getProviders);
router.get('/methods', shippingController.getMethods);
router.post('/calculate-fee', shippingController.calculateFee);

// Customer routes
router.get('/tracking/:orderId', authenticateToken, shippingController.getTrackingHistory);

// Admin routes
router.post('/tracking/:orderId/update', authenticateToken, isAdmin, shippingController.updateStatus);

module.exports = router;