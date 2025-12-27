const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT id, username, full_name, email, role, status FROM Users");
    res.json(result.recordset);
  } catch (err) {
    console.log(err);
    res.status(500).send("Query error");
  }
});

module.exports = router;
