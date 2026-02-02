const express = require("express");
const {} = require("../controllers/voucher_controller");
const {
  getAllVouchers,
  getByIdVoucher,
  createVoucher,
  updateVoucher,
  updateStatusVoucher,
  deleteVoucher,
} = require("../controllers/voucher_controller");

const router = express.Router();

router.get("/", getAllVouchers);
router.get("/:id", getByIdVoucher);
router.post("/", createVoucher);
router.put("/:id", updateVoucher);
router.patch("/:id/status", updateStatusVoucher);
router.delete("/:id", deleteVoucher);

module.exports = router;
