const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { verifyToken } = require("../middleware/authMiddleware");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

console.log("✅ uploadRoutes loaded");

// رفع الملف
router.post("/upload", verifyToken, upload.single("file"), (req, res) => {
    console.log("📤 Upload route hit!");

  const fileUrl = `http://localhost:4000/uploads/${req.file.filename}`;
  res.json({ mediaUrl: fileUrl });
});

module.exports = router;
