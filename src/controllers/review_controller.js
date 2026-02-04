const ReviewModel = require("../models/review_model");

const getAllReviews = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await ReviewModel.getAll(Number(page) || 1, Number(limit) || 10);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching reviews" });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page, limit } = req.query;
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }
    const result = await ReviewModel.getByProductId(Number(productId), Number(page) || 1, Number(limit) || 5);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching product reviews" });
  }
};

const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ReviewModel.getById(Number(id));
    if (!result) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching review" });
  }
};

const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id; // From authMiddleware
    const { rating, comment, is_anonymous, media_urls } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: "Rating and comment are required" });
    }

    const result = await ReviewModel.create(Number(userId), Number(productId), {
      rating: Number(rating),
      comment,
      is_anonymous,
      media_urls,
    });
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    if (err.message === "Bạn đã đánh giá sản phẩm này rồi") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message || "Server error while creating review" });
  }
};

const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ReviewModel.update(Number(id), req.body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while updating review" });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ReviewModel.delete(Number(id));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while deleting review" });
  }
};

const getProductRating = async (req, res) => {
  try {
    const { productId } = req.params;
    const average = await ReviewModel.getAverageRating(Number(productId));
    const distribution = await ReviewModel.getRatingDistribution(Number(productId));
    res.json({ average, distribution });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching rating info" });
  }
};

const checkUserPurchase = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    const hasPurchased = await ReviewModel.checkUserPurchase(Number(userId), Number(productId));
    res.json({ has_purchased: hasPurchased });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while checking purchase status" });
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
