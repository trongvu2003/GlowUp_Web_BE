const shippingService = require('../services/shipping_service');

class ShippingController {
  // [PUBLIC] Lấy danh sách nhà vận chuyển
  async getProviders(req, res) {
    try {
      const providers = await shippingService.getAllProviders();
      res.json({
        success: true,
        data: providers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách nhà vận chuyển',
        error: error.message
      });
    }
  }

  // [PUBLIC] Lấy phương thức vận chuyển
  async getMethods(req, res) {
    try {
      const { providerId } = req.query;
      
      let methods;
      if (providerId) {
        methods = await shippingService.getMethodsByProvider(providerId);
      } else {
        methods = await shippingService.getAllMethods();
      }

      res.json({
        success: true,
        data: methods
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy phương thức vận chuyển',
        error: error.message
      });
    }
  }

  // [PUBLIC] Tính phí vận chuyển
  async calculateFee(req, res) {
    try {
      const { methodId, distance } = req.body;

      if (!methodId) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn phương thức vận chuyển'
        });
      }

      const fee = await shippingService.calculateShippingFee(methodId, distance || 10);

      res.json({
        success: true,
        data: {
          shipping_fee: fee,
          method_id: methodId,
          distance: distance || 10
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tính phí vận chuyển',
        error: error.message
      });
    }
  }

  // [CUSTOMER] Lấy lịch sử vận chuyển đơn hàng
  async getTrackingHistory(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      // TODO: Kiểm tra order có thuộc về user không
      
      const trackings = await shippingService.getTrackingHistory(orderId);

      res.json({
        success: true,
        data: trackings
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy lịch sử vận chuyển',
        error: error.message
      });
    }
  }

  // [ADMIN] Cập nhật trạng thái vận chuyển
  async updateStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { status, location, description } = req.body;
      const adminId = req.user.id;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập trạng thái'
        });
      }

      const tracking = await shippingService.updateShippingStatus(
        orderId,
        status,
        location,
        description,
        adminId
      );

      res.json({
        success: true,
        message: 'Cập nhật trạng thái vận chuyển thành công',
        data: tracking
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật trạng thái',
        error: error.message
      });
    }
  }
}

module.exports = new ShippingController();