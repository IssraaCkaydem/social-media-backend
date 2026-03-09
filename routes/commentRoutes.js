const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { addComment, getComments, deleteComment } = require("../controllers/commentController");

router.post("/:id/comments", verifyToken, addComment);

router.get("/:id/comments", getComments);

router.delete("/:id/comments/:commentId", verifyToken, deleteComment);

module.exports = router;
