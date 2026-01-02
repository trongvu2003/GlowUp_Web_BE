const express = require("express");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8082;
const hostname = process.env.HOST_NAME;

// Middleware parse JSON
app.use(express.json());

// Khai bao routes
const userRoutes = require("./routes/user_route");
app.use("/api/users", userRoutes);

app.listen(port, hostname, () => {
  console.log(`app listening on port ${port}`);
});
