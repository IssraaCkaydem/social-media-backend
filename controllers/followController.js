const User = require("../models/User");

exports.followUser = async (req, res) => {
  try {
    const userId = req.user.id;       
    const targetId = req.params.id;  

    if (userId === targetId) {
      return res.status(400).json({ msg: "You can't follow yourself" });
    }

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetId);

    if (!targetUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (!user.following.includes(targetId)) {
      user.following.push(targetId);
      targetUser.followers.push(userId);

      await user.save();
      await targetUser.save();

      res.status(200).json({ msg: "User followed successfully" });
    } else {
      res.status(400).json({ msg: "Already following this user" });
    }
  } catch (err) {
    res.status(500).json({ msg: "Error following user", error: err.message });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetId);

    if (!targetUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user.following.includes(targetId)) {
      user.following = user.following.filter(id => id.toString() !== targetId);
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId);

      await user.save();
      await targetUser.save();

      res.status(200).json({ msg: "User unfollowed successfully" });
    } else {
      res.status(400).json({ msg: "You are not following this user" });
    }
  } catch (err) {
    res.status(500).json({ msg: "Error unfollowing user", error: err.message });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("followers", "name profilePic email");

    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json(user.followers);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// 📍 Get Following List
exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("following", "name profilePic email");

    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json(user.following);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
}; 