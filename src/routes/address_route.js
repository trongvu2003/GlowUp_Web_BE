const express = require("express");
const router = express.Router();
const {
    createAddress,
    getAddressDetail,
    getAllAddress, 
    updateAddress, 
    setDefaultAddress,
    deleteAddress
} = require("../controllers/address_controller");

router.get("/user/:userId", getAllAddress);
router.post("/user/:userId", createAddress);
router.get("/:id/user/:userId", getAddressDetail);
router.put("/:id/user/:userId", updateAddress);
router.delete("/:id/user/:userId", deleteAddress);
router.patch("/:id/user/:userId/default", setDefaultAddress);

module.exports = router;