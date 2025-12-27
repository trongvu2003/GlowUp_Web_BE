const express = require("express");

require("dotenv").config();
const { poolPromise } = require("./config/db");
const app = express();
const port = process.env.PORT || 8082;
const hostname = process.env.HOST_NAME;
app.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT GETDATE() AS time");
    res.json(result.recordset);
  } catch (err) {
    console.log(err);
    res.status(500).send("Database error");
  }
});

const userRoute = require("./routes/user.route");
app.use("/api/users", userRoute);

app.listen(port, hostname, () => {
  console.log(`app listening on port ${port}`);
});
