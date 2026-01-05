const express = require("express");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8082;
const hostname = process.env.HOST_NAME;

// Middleware parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Cho phép public folder ảnh
app.use("/uploads", express.static("src/uploads"));

// Khai bao routes
const userRouter = require("./routes/user_route");
app.use("/api/users", userRouter);
app.use("/api/products", require("./routes/product_route"));

app.listen(port, hostname, () => {
  console.log(`app listening on port ${port}`);
});
