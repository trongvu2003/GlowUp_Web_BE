const AddressService = require("../services/address_service");

/**
 * Thêm địa chỉ mới
 */
const createAddress = async (req, res) => {
    try {
        // Lấy userId từ params (nếu route dạng /users/:userId/addresses)
        // Hoặc lấy từ req.user.id nếu bạn dùng Middleware xác thực token
        const userId = req.params.userId || req.body.user_id;
        const data = req.body;

        // 1. Validate dữ liệu đầu vào
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }
        if (!data.contact_name || !data.phone || !data.detail_address) {
            return res.status(400).json({ 
                message: "Vui lòng nhập đầy đủ Tên, SĐT và Địa chỉ chi tiết" 
            });
        }

        // 2. Gọi Service
        const newAddress = await AddressService.create(Number(userId), data);

        // 3. Trả về kết quả
        res.status(201).json({
            success: true,
            message: "Thêm địa chỉ thành công",
            data: newAddress
        });

    } catch (error) {
        console.error("Create Address Error:", error);
        res.status(500).json({ message: "Lỗi server khi tạo địa chỉ", error: error.message });
    }
};

/**
 * Lấy danh sách địa chỉ
 */
const getAllAddress = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }
        
        const result = await AddressService.getAll(Number(userId));
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error while fetching address" });
    }
};

/**
 * Lấy chi tiết 1 địa chỉ
 */
const getAddressDetail = async (req, res) => {
    try {
        const { userId, id } = req.params; // Lấy cả userId và id địa chỉ
        
        const address = await AddressService.getById(Number(id), Number(userId));
        
        res.json({
            success: true,
            data: address
        });
    } catch (error) {
        // Phân biệt lỗi không tìm thấy (404) và lỗi server (500)
        res.status(404).json({ message: error.message });
    }
};

/**
 * Cập nhật địa chỉ
 */
const updateAddress = async (req, res) => {
    try {
        const { userId, id } = req.params;
        const data = req.body;

        const updatedAddress = await AddressService.update(Number(id), Number(userId), data);

        res.json({
            success: true,
            message: "Cập nhật địa chỉ thành công",
            data: updatedAddress
        });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: error.message || "Lỗi khi cập nhật địa chỉ" });
    }
};

/**
 * Xóa địa chỉ
 */
const deleteAddress = async (req, res) => {
    try {
        const { userId, id } = req.params;

        await AddressService.delete(Number(id), Number(userId));

        res.json({
            success: true,
            message: "Xóa địa chỉ thành công"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Đặt làm mặc định
 */
const setDefaultAddress = async (req, res) => {
    try {
        const { userId, id } = req.params;

        await AddressService.setDefault(Number(id), Number(userId));

        res.json({
            success: true,
            message: "Đã đặt làm địa chỉ mặc định"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createAddress,
    getAllAddress,
    getAddressDetail,
    updateAddress,
    deleteAddress,
    setDefaultAddress
};