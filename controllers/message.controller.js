

const messageService = require("../services/message.service");

// =======================
// SEND TEXT MESSAGE
// =======================

exports.sendMessage = async (req, res) => {
  try {
    const msg = await messageService.sendMessage(
      req.user.id,
      req.body.receiverId,
      req.body.text
    );

    // 🔥 real-time unread count
    const io = req.app.get("io");
    const unreadCount = await messageService.getUnreadCount(req.body.receiverId);
    io.to(req.body.receiverId).emit("unreadCount", unreadCount);

    res.status(201).json(msg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
// =======================
// SEND VOICE MESSAGE
// =======================
exports.sendVoiceMessage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No voice file uploaded" });
    }

    const msg = await messageService.sendVoiceMessage(
      req.user.id,
      req.body.receiverId,
      req.file.path
    );

    // 🔥 real-time unread count
    const io = req.app.get("io");
    const unreadCount = await messageService.getUnreadCount(req.body.receiverId);
    io.to(req.body.receiverId).emit("unreadCount", unreadCount);

    res.status(201).json(msg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// =======================
// GET MESSAGES WITH USER
// =======================
exports.getMessagesWithUser = async (req, res) => {
  try {
    const messages = await messageService.getMessagesWithUser(
      req.user.id,
      req.params.userId
    );

    res.json(messages);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};

// =======================
// DELETE FOR ME
// =======================
exports.deleteMessageForMe = async (req, res) => {
  try {
    await messageService.deleteMessageForMe(
      req.user.id,
      req.params.messageId
    );

    res.json({ message: "Message deleted for you" });
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};

// =======================
// DELETE FOR EVERYONE
// =======================
exports.deleteMessageForEveryone = async (req, res) => {
  try {
    await messageService.deleteMessageForEveryone(
      req.user.id,
      req.params.messageId
    );

    res.json({ message: "Message deleted for everyone" });
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};

// =======================
// INBOX
// =======================
exports.getUsersWithMessages = async (req, res) => {
  try {
    const users = await messageService.getUsersWithMessages(req.user.id);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =======================
// 🔥 MARK AS SEEN (REAL-TIME)
// =======================
exports.markAsSeen = async (req, res) => {
  try {
    const userId = req.user.id; // الشخص يلي فتح الشات (B)
    const otherUserId = req.params.userId; // الشخص يلي باعث الرسائل (A)

    // تحديث الرسائل كمقروءة
    const result = await messageService.markMessagesAsSeen(
      userId,
      otherUserId
    );

    // 🟢 socket
    const io = req.app.get("io");

    // إعلام الشخص المرسل أن رسائله تمت قراءتها
    io.to(otherUserId).emit("messagesSeen", { seenBy: userId });

    // 🔥 تحديث unreadCount مباشرة للمرسل
    const unreadCount = await messageService.getUnreadCount(otherUserId);
    io.to(otherUserId).emit("unreadCount", unreadCount);

    res.json({
      message: "Messages marked as seen",
      updated: result.modifiedCount,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
