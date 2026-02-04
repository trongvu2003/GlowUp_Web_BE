const ReviewService = require("../services/review_service");

const getAllReviews = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    const result = await ReviewService.getAllReviews(page, limit);
    res.json(result);
  } catch (error) {
    console.error("Error getting reviews:", error.stack || error);
    res.status(500).json({ message: "Lỗi server khi lấy đánh giá" });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = req.query.page || 1;
    const limit = req.query.limit || 5;

    if (!productId) {
      return res.status(400).json({ message: "Product ID là bắt buộc" });
    }

    const result = await ReviewService.getProductReviews(productId, page, limit);
    res.json(result);
  } catch (error) {
    console.error("Error getting product reviews:", error);
    res.status(500).json({ message: "Lỗi server khi lấy đánh giá sản phẩm" });
  }
};

const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Review ID là bắt buộc" });
    }

    const review = await ReviewService.getReviewById(id);

    if (!review) {
      return res.status(404).json({ message: "Đánh giá không tồn tại" });
    }

    res.json(review);
  } catch (error) {
    console.error("Error getting review:", error);
    res.status(500).json({ message: "Lỗi server khi lấy đánh giá" });
  }
};

const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id; // From auth middleware

    if (!productId) {
      return res.status(400).json({ message: "Product ID là bắt buộc" });
    }

    const { rating, comment, is_anonymous, media_urls } = req.body;

    const result = await ReviewService.createReview(userId, productId, {
      rating: parseInt(rating),
      comment,
      is_anonymous: is_anonymous === "true" || is_anonymous === true,
      media_urls: media_urls || [],
    });

    res.json(result);
  } catch (error) {
    console.error("Error creating review:", error);

    if (error.message.includes("đã đánh giá")) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: error.message || "Lỗi server khi tạo đánh giá" });
  }
};

const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id) {
      return res.status(400).json({ message: "Review ID là bắt buộc" });
    }

    // Check if review belongs to user
    const review = await ReviewService.getReviewById(id);

    if (!review) {
      return res.status(404).json({ message: "Đánh giá không tồn tại" });
    }

    if (review.user_id !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa đánh giá này" });
    }

    const { rating, comment, is_anonymous, media_urls } = req.body;
    const updateData = {};

    if (rating !== undefined) updateData.rating = parseInt(rating);
    if (comment !== undefined) updateData.comment = comment;
    if (is_anonymous !== undefined) updateData.is_anonymous = is_anonymous === "true" || is_anonymous === true;
    if (media_urls !== undefined) updateData.media_urls = media_urls;

    const result = await ReviewService.updateReview(id, updateData);
    res.json(result);
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ message: error.message || "Lỗi server khi cập nhật đánh giá" });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id) {
      return res.status(400).json({ message: "Review ID là bắt buộc" });
    }

    // Check if review belongs to user
    const review = await ReviewService.getReviewById(id);

    if (!review) {
      return res.status(404).json({ message: "Đánh giá không tồn tại" });
    }

    if (review.user_id !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền xóa đánh giá này" });
    }

    const result = await ReviewService.deleteReview(id);
    res.json(result);
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Lỗi server khi xóa đánh giá" });
  }
};

const getProductRating = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "Product ID là bắt buộc" });
    }

    const rating = await ReviewService.getProductRating(productId);
    res.json(rating);
  } catch (error) {
    console.error("Error getting product rating:", error);
    res.status(500).json({ message: "Lỗi server khi lấy rating sản phẩm" });
  }
};

const checkUserPurchase = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id;

    if (!userId || !productId) {
      return res.json({ hasPurchased: false });
    }

    const hasPurchased = await ReviewService.checkUserPurchase(userId, productId);
    res.json({ hasPurchased });
  } catch (error) {
    console.error("Error checking purchase:", error);
    res.json({ hasPurchased: false });
  }
};

module.exports = {
  getAllReviews,
  getProductReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getProductRating,
  checkUserPurchase,
};
