
const Post = require("../models/Post");

// ✅ Like or Unlike a Post
exports.toggleLike = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const alreadyLiked = post.likes.includes(userId);
    if (alreadyLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    const updatedPost = await Post.findById(postId).populate("likes", "name");

    res.json({
      msg: alreadyLiked ? "Post unliked" : "Post liked",
      likesCount: updatedPost.likes.length,
      likesUsers: updatedPost.likes 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};
