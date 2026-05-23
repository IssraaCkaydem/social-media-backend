const User = require('../models/User');

exports.getProfile = async (req, res) => {

  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ msg: "Not authenticated" });

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    console.log("📌 userId:", userId);

    const name = req.body?.name;
    const email = req.body?.email;

    const profilePic = req.file ? `http://localhost:4000/uploads/${req.file.filename}` : undefined;

    if (!name || !email) {
      return res.status(400).json({ msg: "Name and email are required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, ...(profilePic && { profilePic }) },
      { new: true }
    ).select("-password");

    res.json({ msg: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    console.error("💥 Error in updateProfile:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};






exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("name profilePic isOnline lastSeen");
    
    if (!user) return res.status(404).json({ msg: "User not found" });
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
