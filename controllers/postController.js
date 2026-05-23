

const Post = require("../models/Post");
const mongoose = require("mongoose");
const User = require("../models/User");

// ================= 1. UPLOAD POST =================
exports.uploadPost = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { text } = req.body;

    if (!req.file) {
      return res.status(400).json({ msg: "Please upload an image" });
    }

    const mediaUrl = `${req.protocol}://${req.get("host")}/uploads/images/${req.file.filename}`;
    const mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";

    const newPost = new Post({
      userId,
      text,
      mediaUrl,
      mediaType,
    });

    await newPost.save();

    const populatedPost = await Post.findById(newPost._id).populate("userId", "name profilePic");

    return res.status(201).json({ msg: "Post uploaded successfully", post: populatedPost });
  } catch (err) {
    console.error("Upload Error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5; 
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(limit)
      .populate("userId", "name profilePic")
      .populate("likes", "name profilePic")
      .populate("comments.user", "name profilePic");

    const postsWithLikesUsers = posts.map((post) => ({
      ...post.toObject(),
      likesUsers: post.likes || [],
    }));

    const totalPosts = await Post.countDocuments();

    const hasMore = totalPosts > (skip + posts.length);

    return res.status(200).json({
      posts: postsWithLikesUsers,
      hasMore
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ================= 3. GET USER POSTS =================
exports.getUserPosts = async (req, res) => {
  try {
    let userId = req.params.userId.trim();

    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .populate("userId", "name profilePic")
      .populate("likes", "name profilePic")
      .populate("comments.user", "name profilePic");

    const postsWithLikesUsers = posts.map((post) => ({
      ...post.toObject(),
      likesUsers: post.likes,
    }));

    res.status(200).json(postsWithLikesUsers);
  } catch (err) {
    console.error("Get User Posts Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ================= 4. UPDATE POST =================
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
      likesUsers: post.likes,
    };

    res.json(postWithLikesUsers);
  } catch (err) {
    console.error("Update post error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ================= 5. DELETE POST =================
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

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