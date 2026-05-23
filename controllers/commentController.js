const Post = require("../models/Post");


exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = {
      user: req.user.id,
      text,
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    await post.populate("comments.user", "name profilePic");

    res.status(201).json({
      message: "Comment added successfully",
      comments: post.comments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.getComments = async (req, res) => {
  try {
    const postId = req.params.id;
const post = await Post.findById(postId)
  .populate("comments.user", "name profilePic"); 

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }


  
    res.status(200).json(post.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params; 

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

   
   if (comment.user.toString() !== req.user.id && post.userId.toString() !== req.user.id) {

      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    comment.deleteOne(); 
    await post.save();

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
