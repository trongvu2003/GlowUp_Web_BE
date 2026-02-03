const express = require("express");
require("dotenv").config();
const cors = require("cors");

const app = express();
const port = process.env.PORT || 8081;

/* ================= MIDDLEWARE ================= */

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.options(/.*/, cors());

// Parse JSON (fix lỗi body rỗng / VNPay)
app.use(express.json({ strict: false }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use("/uploads", express.static("src/uploads"));

/* ================= ROUTES ================= */

app.use("/api/users", require("./routes/user_route"));
app.use("/api/products", require("./routes/product_route"));
app.use("/api/auth", require("./routes/auth_route"));
app.use("/api/categories", require("./routes/category_route"));
app.use('/api/shipping',require("./routes/shipping_routes"));

app.use("/api/vouchers", require("./routes/voucher_route"));
app.use("/api/carts", require("./routes/cart_route"));
app.use("/api/orders", require("./routes/order_route"));
app.use("/api/vnpay", require("./routes/vnpay_route"));
app.use("/api/chatbot", require("./routes/chatbot"));
app.use("/api/address", require("./routes/address_route"));
app.use("/api/store", require("./routes/store_routes"));

/* ================= START SERVER ================= */

app.listen(port, () => {
  console.log(` Server running on port ${port}`);
});
