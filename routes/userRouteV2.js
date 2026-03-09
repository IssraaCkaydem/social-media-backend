const express = require("express");
const router = express.Router();

const { getUserById, searchUsers } = require("../controllers/userControllerV2");
const { verifyToken } = require("../middleware/authMiddleware");

// Routes
router.get("/search", searchUsers);
router.get("/:id", verifyToken, getUserById);

module.exports = router;
