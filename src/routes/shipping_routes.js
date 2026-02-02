const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shipping_controller');

// Public routes
router.get('/providers', shippingController.getProviders);
router.get('/methods', shippingController.getMethods);
router.post('/calculate-fee', shippingController.calculateFee);

// Customer routes
router.get('/tracking/:orderId', shippingController.getTrackingHistory);

// Admin routes
router.post('/tracking/:orderId/update', shippingController.updateStatus);

router.post('/tracking/:orderId', shippingController.createTracking);

module.exports = router;