
const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
<<<<<<< HEAD
const { getProfile, updateProfile, getUserById } = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");
=======
const { getProfile, updateProfile } = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");

>>>>>>> 487d287d610ecf32cf17e5481b47ab57ccc35bde
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

<<<<<<< HEAD




router.get("/:userId", verifyToken, getUserById);




=======
>>>>>>> 487d287d610ecf32cf17e5481b47ab57ccc35bde
module.exports = router;

