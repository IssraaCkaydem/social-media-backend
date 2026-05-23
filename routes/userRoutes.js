
const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const { getProfile, updateProfile, getUserById } = require("../controllers/userController");
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

// GET profile
router.get("/me", verifyToken, getProfile);

router.put("/me", verifyToken, upload.single("profilePic"), updateProfile);





router.get("/:userId", verifyToken, getUserById);




module.exports = router;

