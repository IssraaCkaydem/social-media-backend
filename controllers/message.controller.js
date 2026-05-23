
const jwt = require('jsonwebtoken');
const Message = require("../models/Message"); 
exports.sendMessage = async (req, res) => {
  try {
    const msg = await service.sendMessage(
      req.user.id,
      req.body.receiverId,
      req.body.text
    );

    const io = req.app.get("io");

    io.to(req.body.receiverId).emit("newMessage", msg);

    const unread = await service.getUnreadCount(req.body.receiverId);
    io.to(req.body.receiverId).emit("unreadCount", unread);

    res.json(msg);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};


exports.sendVoiceMessage = async (req, res) => {
  try {
    const msg = await service.sendVoiceMessage(
      req.user.id,
      req.body.receiverId,
      req.file.path
    );

    const io = req.app.get("io");

    // نفس التعديل هون
    io.to(req.body.receiverId).emit("newMessage", msg);

    const unread = await service.getUnreadCount(req.body.receiverId);
    io.to(req.body.receiverId).emit("unreadCount", unread);

    res.json(msg);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};




exports.getMessagesWithUser = async (req, res) => {
  console.log("🧠 CONTROLLER HIT");

  const data = await service.getMessagesWithUser(
    req.user.id,
    req.params.userId
  );

  console.log("📤 RESPONSE TO FRONT:", data.length);

  res.json(data);
};

// SEEN (REAL DB + SOCKET NOTIFY)
exports.markAsSeen = async (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.userId;

  await service.markMessagesAsSeen(userId, otherUserId);

  const io = req.app.get("io");

  io.to(otherUserId).emit("messagesSeen", { seenBy: userId });

  const unread = await service.getUnreadCount(otherUserId);
  io.to(otherUserId).emit("unreadCount", unread);

  res.json({ success: true });
};

// DELETE FOR ME
exports.deleteMessageForMe = async (req, res) => {
  try {
    const msg = await service.deleteMessageForMe(
      req.user.id,
      req.params.messageId
    );

    const io = req.app.get("io");

    io.to(msg.senderId.toString()).emit("messageDeleted", {
      messageId: msg._id,
    });

    io.to(msg.receiverId.toString()).emit("messageDeleted", {
      messageId: msg._id,
    });

    res.json(msg);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// DELETE FOR EVERYONE
exports.deleteMessageForEveryone = async (req, res) => {
  try {
    const msg = await service.deleteMessageForEveryone(
      req.user.id,
      req.params.messageId
    );

    const io = req.app.get("io");

    io.to(msg.senderId.toString()).emit("messageDeleted", {
      messageId: msg._id,
    });

    io.to(msg.receiverId.toString()).emit("messageDeleted", {
      messageId: msg._id,
    });

    res.json(msg);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
// INBOX
exports.getUsersWithMessages = async (req, res) => {
  const users = await service.getUsersWithMessages(req.user.id);
  res.json(users);
};



// ================= CONTROLLER =================

// CLEAR CHAT FOR ME
exports.clearChatForMe = async (req, res) => {
  try {
    await service.clearChatForMe(
      req.user.id,
      req.params.userId
    );

    res.json({
      success: true,
      message: "Chat cleared successfully",
    });
  } catch (e) {
    res.status(400).json({
      error: e.message,
    });
  }
};


exports.getInboxBadgeCount = async (req, res) => {
  try {
    const count = await service.getInboxBadgeCount(req.user.id);

    res.json({
      success: true,
      count,
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};


exports.sendImageMessage = async (req, res) => {
    try {
        const { receiverId, text } = req.body;

        const senderId = req.user?.id; 

        console.log("DEBUG -> SenderID from req.user:", senderId);

        if (!senderId) {
            return res.status(401).json({ message: "Sender ID not found! Please check auth middleware." });
        }

        if (!req.file) {
            return res.status(400).json({ message: "No image file provided" });
        }

        const imageUrl = `/uploads/images/${req.file.filename}`;

        const newMessage = await Message.create({
            senderId: senderId,
            receiverId: receiverId,
            type: 'image',
            imageUrl: imageUrl,
            text: text || ''
        });


        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Critical Error in sendImageMessage:", error);
        res.status(500).json({ message: error.message });
    }
};


// POST /api/stories/reply
exports.replyToStory = async (req, res) => {
  try {
    const { storyId, text, receiverId, storySnapshot } = req.body;
    
    const senderId = req.user.id || req.user._id; 

    if (!senderId) {
      return res.status(401).json({ message: "Sender ID not found!" });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      type: 'story_reply', 
      storyId,
      storySnapshot 
    });

    await newMessage.save();

    const populatedMessage = await newMessage.populate('senderId', 'name profilePic');
    
    const io = req.app.get("io") || global.io; 
    
    if (io) {
      io.to(receiverId.toString()).emit('newMessage', populatedMessage);
      
      io.to(receiverId.toString()).emit('storyReaction', {
        senderName: req.user.name,
        emoji: text
      });
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error in replyToStory:", error);
    res.status(500).json({ message: "Error replying to story", error: error.message });
  }
};