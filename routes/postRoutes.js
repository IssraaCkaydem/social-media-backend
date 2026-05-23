




const express = require("express");
const router = express.Router();

const Post = require("../models/Post");

const upload = require("../middleware/uploadImage"); 
const { verifyToken } = require("../middleware/authMiddleware");
const likeController = require("../controllers/likeController");
const {
  uploadPost,
  getAllPosts,
  getUserPosts,
  updatePost,
  deletePost
} = require("../controllers/postController"); 

router.post("/uploadpost", verifyToken, upload.single("image"), uploadPost);
router.get("/all", verifyToken, getAllPosts);
router.get("/profile/:userId", getUserPosts);

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate("userId", "name profilePic")
      .populate("comments.user", "name profilePic");

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    res.status(200).json(post);
  } catch (err) {
    console.error("❌ Error fetching single post:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

router.put("/:id", verifyToken, updatePost);
router.delete("/:id", verifyToken, deletePost);
router.put("/:postId/like", verifyToken, likeController.toggleLike);

module.exports = router;