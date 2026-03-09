const User = require("../models/User");
const Post = require("../models/Post");


exports.getUserById = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id)
      .select("name email profilePic followers following");

    if (!targetUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    const currentUser = await User.findById(req.user.id);

    let isFollowing = false;
    if (currentUser && currentUser.following && targetUser?._id) {
      isFollowing = currentUser.following
        .map(id => id.toString())
        .includes(targetUser._id.toString());
    }

    const posts = await Post.find({ userId: targetUser._id })
      .sort({ createdAt: -1 })
      .populate("userId", "name profilePic")
      .populate("likes", "name profilePic")
        .populate("comments.user", "name profilePic"); 

    const postsWithLikesUsers = posts.map(post => ({
      ...post.toObject(),
      likesUsers: post.likes, 
    }));

    res.status(200).json({
      user: targetUser,
      isFollowing,
      postsCount: postsWithLikesUsers.length,
      posts: postsWithLikesUsers,
    });
  } catch (err) {
    console.error("❌ getUserById error:", err);
    res.status(500).json({ msg: "Error fetching user", error: err.message });
  }
};





// Search users
exports.searchUsers= async (req, res) => {
  try {
    const name = req.query.name;
    const users = await User.find({
      name: { $regex: name, $options: "i" },
    }).select("name email");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ msg: "Error searching users" });
  }
};
