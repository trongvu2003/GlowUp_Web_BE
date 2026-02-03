const { sql, poolPromise } = require("../config/db");

class ReviewModel {
  static async getAll(page = 1, limit = 10) {
    try {
      const pool = await poolPromise;
      if (!pool) {
        throw new Error("Database connection pool is null");
      }
      const offset = (page - 1) * limit;
      const result = await pool
      .request()
      .input("limit", sql.Int, limit)
      .input("offset", sql.Int, offset)
      .query(`
        SELECT 
          r.id,
          r.user_id,
          r.product_id,
          r.rating,
          r.comment,
          r.is_anonymous,
          r.created_at,
          u.name as username,
          p.name as product_name,
          0 as has_purchased
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN products p ON r.product_id = p.id
        ORDER BY r.created_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);

    const totalResult = await pool.request().query("SELECT COUNT(*) as total FROM reviews");
    
    return {
      data: result.recordset.map((r) => ({
        ...r,
        media_urls: [],
      })),
      total: totalResult.recordset[0].total,
    };
    } catch (error) {
      console.error("Error in getAll:", error);
      throw error;
    }
  }

  static async getByProductId(productId, page = 1, limit = 5) {
    const pool = await poolPromise;
    const offset = (page - 1) * limit;

    const result = await pool
      .request()
      .input("productId", sql.Int, productId)
      .input("limit", sql.Int, limit)
      .input("offset", sql.Int, offset)
      .query(`
        SELECT 
          r.id,
          r.user_id,
          r.product_id,
          r.rating,
          r.comment,
          r.is_anonymous,
          r.created_at,
          u.name as username,
          0 as has_purchased
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.product_id = @productId
        ORDER BY r.created_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);

    const totalResult = await pool
      .request()
      .input("productId", sql.Int, productId)
      .query("SELECT COUNT(*) as total FROM reviews WHERE product_id = @productId");

    return {
      data: result.recordset.map((r) => ({
        ...r,
        media_urls: [],
      })),
      total: totalResult.recordset[0].total,
    };
  }

  static async getById(id) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT 
          r.id,
          r.user_id,
          r.product_id,
          r.rating,
          r.comment,
          r.is_anonymous,
          r.created_at,
          u.name as username,
          CASE WHEN EXISTS (
            SELECT 1 FROM cart_items ci
            JOIN carts c ON ci.cart_id = c.id
            WHERE c.user_id = r.user_id AND ci.product_id = r.product_id
          ) THEN 1 ELSE 0 END as has_purchased
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.id = @id
      `);

    if (!result.recordset[0]) return null;

    const review = result.recordset[0];
    return {
      ...review,
      media_urls: [],
    };
  }

  static async create(userId, productId, data) {
    const pool = await poolPromise;
    
    // Check if user already reviewed this product
    const existingReview = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("productId", sql.Int, productId)
      .query(
        "SELECT id FROM reviews WHERE user_id = @userId AND product_id = @productId"
      );

    if (existingReview.recordset.length > 0) {
      throw new Error("Bạn đã đánh giá sản phẩm này rồi");
    }

    // Check if user purchased this product
    const purchaseCheck = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("productId", sql.Int, productId)
      .query(`
        SELECT COUNT(*) as count FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.id
        WHERE c.user_id = @userId AND ci.product_id = @productId
      `);

    const hasPurchased = purchaseCheck.recordset[0].count > 0;

    await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("product_id", sql.Int, productId)
      .input("rating", sql.Int, data.rating)
      .input("comment", sql.NVarChar(sql.MAX), data.comment)
      .input("is_anonymous", sql.Bit, data.is_anonymous ? 1 : 0)
      .query(`
        INSERT INTO reviews (user_id, product_id, rating, comment, is_anonymous)
        VALUES (@user_id, @product_id, @rating, @comment, @is_anonymous)
      `);

    return { message: "Đánh giá đã được tạo" };
  }

  static async update(id, data) {
    const pool = await poolPromise;
    
    const updates = [];
    const request = pool.request().input("id", sql.Int, id);

    if (data.rating !== undefined) {
      updates.push("rating = @rating");
      request.input("rating", sql.Int, data.rating);
    }

    if (data.comment !== undefined) {
      updates.push("comment = @comment");
      request.input("comment", sql.NVarChar(sql.MAX), data.comment);
    }

    if (data.media_urls !== undefined) {
      updates.push("media_urls = @media_urls");
      request.input("media_urls", sql.NVarChar(sql.MAX), JSON.stringify(data.media_urls || []));
    }

    if (data.is_anonymous !== undefined) {
      updates.push("is_anonymous = @is_anonymous");
      request.input("is_anonymous", sql.Bit, data.is_anonymous ? 1 : 0);
    }

    if (updates.length === 0) return { message: "Không có thay đổi" };

    const query = `UPDATE reviews SET ${updates.join(", ")} WHERE id = @id`;
    await request.query(query);

    return { message: "Đánh giá đã được cập nhật" };
  }

  static async delete(id) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM reviews WHERE id = @id");

    return { message: "Đánh giá đã được xóa" };
  }

  static async getAverageRating(productId) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("productId", sql.Int, productId)
      .query(`
        SELECT 
          AVG(CAST(rating as FLOAT)) as averageRating,
          COUNT(*) as totalReviews
        FROM reviews
        WHERE product_id = @productId
      `);

    return result.recordset[0];
  }

  static async getRatingDistribution(productId) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("productId", sql.Int, productId)
      .query(`
        SELECT 
          rating,
          COUNT(*) as count
        FROM reviews
        WHERE product_id = @productId
        GROUP BY rating
        ORDER BY rating DESC
      `);

    return result.recordset;
  }

  static async checkUserPurchase(userId, productId) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("productId", sql.Int, productId)
      .query(`
        SELECT COUNT(*) as count FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.id
        WHERE c.user_id = @userId AND ci.product_id = @productId
      `);

    return result.recordset[0].count > 0;
  }
}

module.exports = ReviewModel;
