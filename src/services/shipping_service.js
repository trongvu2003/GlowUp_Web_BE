const ShippingProviderModel = require('../models/shipping_provider_model');
const ShippingMethodModel = require('../models/shipping_method_model');
const ShippingTrackingModel = require('../models/shipping_tracking_model');

class ShippingService {
  // Lấy danh sách providers
  async getAllProviders() {
    return await ShippingProviderModel.getAll();
  }

  // Lấy danh sách methods
  async getAllMethods() {
    return await ShippingMethodModel.getAll();
  }

  // Lấy methods theo provider
  async getMethodsByProvider(providerId) {
    return await ShippingMethodModel.getByProviderId(providerId);
  }

  // Tính phí vận chuyển
  async calculateShippingFee(methodId, distance = 10) {
    return await ShippingMethodModel.calculateFee(methodId, distance);
  }

  // Tạo tracking mới
  async createTracking(trackingData) {
    // Validate data
    if (!trackingData.order_id) {
      throw new Error('Order ID là bắt buộc');
    }

    if (!trackingData.status) {
      throw new Error('Trạng thái là bắt buộc');
    }

    // Tạo tracking trong database
    const newTracking = await ShippingTrackingModel.create(trackingData);

    return newTracking;
  }

  // Lấy lịch sử tracking
  async getTrackingHistory(orderId) {
    return await ShippingTrackingModel.getByOrderId(orderId);
  }

  // Cập nhật trạng thái vận chuyển
  async updateShippingStatus(orderId, status, location, description, updatedBy) {
    const trackingData = {
      order_id: orderId,
      status: status,
      location: location,
      description: description,
      updated_by: updatedBy
    };

    return await ShippingTrackingModel.create(trackingData);
  }
}

module.exports = new ShippingService();