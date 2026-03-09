

const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const likeController = require("../controllers/likeController");
const {
  uploadPost,
  getAllPosts,
  getUserPosts,
  updatePost,
  deletePost
} = require("../controllers/postController"); 

router.post("/uploadpost", verifyToken, uploadPost);

router.get("/all", verifyToken, getAllPosts);

router.get("/profile/:userId", getUserPosts);

router.put("/:id", verifyToken, updatePost);

router.delete("/:id", verifyToken, deletePost);

router.put("/:postId/like", verifyToken, likeController.toggleLike);

module.exports = router;
