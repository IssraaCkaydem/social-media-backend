const Story = require("../models/Story");
const User = require("../models/User");

exports.createStory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "Please upload an image for your story" });
    }

    const newStory = new Story({
      userId: req.user.id,
      imageUrl: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
    });

    await newStory.save();

    const populatedStory = await newStory.populate("userId", "name profilePic");

    res.status(201).json(populatedStory);
  } catch (err) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};


exports.getStories = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const followings = currentUser.following || [];
    const usersToSee = [...followings, req.user.id];

    const stories = await Story.find({ userId: { $in: usersToSee } })
      .sort({ createdAt: 1 }) 
      .populate("userId", "name profilePic") 
      .populate("seenBy.userId", "name profilePic"); 

    res.json(stories);
  } catch (err) {
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ msg: "Story not found" });
    }

    if (story.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    await story.deleteOne();
    res.json({ msg: "Story removed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

exports.markStoryAsSeen = async (req, res) => {
  try {
    const storyId = req.params.id;
    const viewerId = req.user.id;

    let story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ msg: "Story not found" });

    if (story.userId.toString() !== viewerId) {
      const viewerIndex = story.seenBy.findIndex(
        (v) => v.userId.toString() === viewerId
      );

      if (viewerIndex > -1) {
        story.seenBy[viewerIndex].count += 1;
      } else {
        story.seenBy.push({ userId: viewerId, count: 1 });
      }

      story.markModified('seenBy');
      await story.save();
    }

    const updatedStory = await Story.findById(storyId)
      .populate("userId", "name profilePic")
      .populate("seenBy.userId", "name profilePic");

    const io = req.app.get('io'); 
    
    if (io) {
      const ownerId = updatedStory.userId._id.toString();
      
      io.to(ownerId).emit("storySeen", updatedStory);
      
      console.log(`✅ Socket emitted to owner: ${ownerId}`);
    } else {
      console.error("❌ Socket IO instance 'io' not found in req.app");
    }

    res.json(updatedStory);
    
  } catch (err) {
    console.error("❌ Error in markStoryAsSeen:", err);
    res.status(500).send("Server error");
  }
};