const express = require("express");
const router = express.Router();
const {
  getAllReviews,
  getProductReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getProductRating,
  checkUserPurchase,
} = require("../controllers/review_controller");

const authMiddleware = require("../middlewares/auth");

// Public routes
router.get("/", getAllReviews);
router.get("/product/:productId", getProductReviews);
router.get("/rating/:productId", getProductRating);
router.get("/:id", getReviewById);
router.get("/check-purchase/:productId", authMiddleware, checkUserPurchase);

// Protected routes (require authentication)
router.post("/product/:productId", authMiddleware, createReview);
router.put("/:id", authMiddleware, updateReview);
router.delete("/:id", authMiddleware, deleteReview);

module.exports = router;
