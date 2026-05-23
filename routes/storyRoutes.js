const express = require("express");
const router = express.Router();
const { createStory, getStories,deleteStory,markStoryAsSeen } = require("../controllers/storyController");
const { verifyToken } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, "story-" + Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Routes
router.post("/", verifyToken, upload.single("image"), createStory);
router.get("/", verifyToken, getStories);
router.delete("/:id", verifyToken, deleteStory);
router.post("/seen/:id", verifyToken, markStoryAsSeen);

module.exports = router;