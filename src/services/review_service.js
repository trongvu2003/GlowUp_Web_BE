const ReviewModel = require("../models/review_model");

class ReviewService {
  static async getAllReviews(page = 1, limit = 10) {
    try {
      const result = await ReviewModel.getAll(page, limit);
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getProductReviews(productId, page = 1, limit = 5) {
    try {
      const result = await ReviewModel.getByProductId(productId, page, limit);
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getReviewById(id) {
    try {
      const review = await ReviewModel.getById(id);
      return review;
    } catch (error) {
      throw error;
    }
  }

  static async createReview(userId, productId, data) {
    try {
      // Validate data
      if (!data.rating || data.rating < 1 || data.rating > 5) {
        throw new Error("Rating phải từ 1-5");
      }

      if (!data.comment || data.comment.trim().length === 0) {
        throw new Error("Nội dung đánh giá không được trống");
      }

      if (data.comment.length > 5000) {
        throw new Error("Nội dung đánh giá không vượt quá 5000 ký tự");
      }

      const result = await ReviewModel.create(userId, productId, data);
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async updateReview(id, data) {
    try {
      if (data.rating && (data.rating < 1 || data.rating > 5)) {
        throw new Error("Rating phải từ 1-5");
      }

      if (data.comment && data.comment.length > 5000) {
        throw new Error("Nội dung đánh giá không vượt quá 5000 ký tự");
      }

      const result = await ReviewModel.update(id, data);
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async deleteReview(id) {
    try {
      const result = await ReviewModel.delete(id);
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getProductRating(productId) {
    try {
      const rating = await ReviewModel.getAverageRating(productId);
      const distribution = await ReviewModel.getRatingDistribution(productId);

      return {
        averageRating: rating.averageRating || 0,
        totalReviews: rating.totalReviews || 0,
        distribution: distribution.reduce((acc, d) => {
          acc[d.rating] = d.count;
          return acc;
        }, {}),
      };
    } catch (error) {
      throw error;
    }
  }

  static async checkUserPurchase(userId, productId) {
    try {
      const hasPurchased = await ReviewModel.checkUserPurchase(userId, productId);
      return hasPurchased;
    } catch (error) {
      console.error("Error checking purchase:", error);
      return false;
    }
  }
}

module.exports = ReviewService;
