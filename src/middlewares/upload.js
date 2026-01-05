const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "src/uploads/products/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + ext);
  },
});

module.exports = multer({ storage });
