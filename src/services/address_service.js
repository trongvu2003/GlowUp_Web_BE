const AddressModel = require("../models/address_model");

class AddressService {
    
    /**
     * Lấy tất cả địa chỉ của một user
     */
    static async getAll(userId) {
        return await AddressModel.getAll(userId);
    }

    /**
     * Lấy chi tiết 1 địa chỉ
     */
    static async getById(id, userId) {
        const address = await AddressModel.getById(id, userId);
        if (!address) {
            throw new Error("Địa chỉ không tồn tại hoặc bạn không có quyền truy cập");
        }
        return address;
    }

    /**
     * Tạo địa chỉ mới
     * data bao gồm: contact_name, phone, address_type, detail_address...
     */
    static async create(userId, data) {
        // Gắn userId vào data để Model biết địa chỉ này của ai
        const newAddressData = { ...data, user_id: userId };
        
        return await AddressModel.create(newAddressData);
    }

    /**
     * Cập nhật địa chỉ
     */
    static async update(id, userId, data) {
        // Gọi Model update
        const updatedAddress = await AddressModel.update(id, userId, data);
        
        // Nếu Model trả về null/undefined nghĩa là không tìm thấy ID hoặc sai UserID
        if (!updatedAddress) {
            throw new Error("Không tìm thấy địa chỉ để cập nhật");
        }
        
        return updatedAddress;
    }

    /**
     * Xóa địa chỉ
     */
    static async delete(id, userId) {
        const isDeleted = await AddressModel.delete(id, userId);
        
        if (!isDeleted) {
            throw new Error("Không tìm thấy địa chỉ để xóa");
        }
        
        return { message: "Xóa địa chỉ thành công" };
    }

    /**
     * Thiết lập địa chỉ mặc định
     */
    static async setDefault(id, userId) {
        // Kiểm tra xem địa chỉ có tồn tại không trước khi set
        const address = await AddressModel.getById(id, userId);
        if (!address) {
            throw new Error("Địa chỉ không tồn tại");
        }

        await AddressModel.setDefault(id, userId);
        return { message: "Đã đặt làm địa chỉ mặc định" };
    }
}

module.exports = AddressService;