const Post = require("../models/Post");
const mongoose = require('mongoose');

const User = require("../models/User"); 

  exports.uploadPost = async (req, res) => {
      try {
    const userId = req.user?.id;
    const { text, mediaUrl, mediaType } = req.body;
 if (!userId || !mediaUrl || !mediaType) {
      return res.status(400).json({ msg: "Missing required fields" });
    }
        const newPost = new Post({
      userId,
      text,
      mediaUrl,
      mediaType,
    });

    await newPost.save();

    return res.status(201).json({ msg: "Post uploaded successfully", post: newPost });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
};


exports.getAllPosts = async (req, res) => {
  try {
    const userId = req.user.id; 
    const user = await User.findById(userId);

    const usersToShow = [userId, ...(user.following || [])];

    const posts = await Post.find({ userId: { $in: usersToShow } })
      .populate("userId", "name email profilePic") 
      .populate("likes", "name") 
     .populate("comments.user", "name profilePic")      
      .sort({ createdAt: -1 });

    const postsWithLikesUsers = posts.map(post => ({
      ...post.toObject(),
      likesUsers: post.likes
    }));

    res.status(200).json(postsWithLikesUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    let userId = req.params.userId.trim();

    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .populate("userId", "name profilePic")  
      .populate("likes", "name profilePic") 
      .populate("comments.user", "name profilePic");  

    const postsWithLikesUsers = posts.map(post => ({
      ...post.toObject(),
      likesUsers: post.likes
    }));

    res.status(200).json(postsWithLikesUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.updatePost = async (req, res) => {
  const { text } = req.body;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ msg: "Invalid post ID" });
  }

  try {
    let post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    if (post.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    post.text = text;
    await post.save();

    post = await Post.findById(post._id)
      .populate("userId", "name profilePic")
      .populate("likes", "name profilePic");

    const postWithLikesUsers = {
      ...post.toObject(),
      likesUsers: post.likes
    };

    res.json(postWithLikesUsers);
  } catch (err) {
    console.error("Update post error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    console.log("post.userId:", post.userId);
    console.log("req.user.id:", req.user?.id);

    if (post.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

await post.deleteOne(); 
    res.json({ msg: "Post removed" });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).send("Server error");
  }
};
