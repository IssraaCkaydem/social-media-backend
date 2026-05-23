

const Message = require("../models/Message");
const User = require("../models/User");

// ================= SEND TEXT =================
exports.sendMessage = async (senderId, receiverId, text) => {
  return await Message.create({
    senderId,
    receiverId,
    text,
    type: "text",
    seen: false,
    deletedForSender: false,
    deletedForReceiver: false,
    deletedForEveryone: false,
  });
};

// ================= SEND VOICE =================
exports.sendVoiceMessage = async (senderId, receiverId, voicePath) => {
  return await Message.create({
    senderId,
    receiverId,
    type: "voice",
    audioUrl: voicePath,
    seen: false,
    deletedForSender: false,
    deletedForReceiver: false,
    deletedForEveryone: false,
  });
};

// ================= GET CHAT =================


exports.getMessagesWithUser = async (userId, otherUserId) => {
  console.log("📥 GET MESSAGES START");
  console.log("userId:", userId);
  console.log("otherUserId:", otherUserId);

  const messages = await Message.find({
    $or: [
      {
        senderId: userId,
        receiverId: otherUserId,
        deletedForSender: false,
        deletedForEveryone: false,
      },
      {
        senderId: otherUserId,
        receiverId: userId,
        deletedForReceiver: false,
        deletedForEveryone: false,
      },
    ],
  }).sort({ createdAt: 1 });

  console.log("📦 MESSAGES FOUND:", messages.length);
  console.log(messages);

  return messages;
};
// ================= MARK SEEN =================
exports.markMessagesAsSeen = async (userId, otherUserId) => {
  return await Message.updateMany(
    {
      senderId: otherUserId,
      receiverId: userId,
      seen: false,
      deletedForReceiver: false,
      deletedForEveryone: false,
    },
    { $set: { seen: true } }
  );
};

// ================= UNREAD COUNT =================


exports.getUnreadCount = async (userId) => {
  const uniqueSenders = await Message.distinct("senderId", {
    receiverId: userId,
    seen: false,
    deletedForReceiver: false,
    deletedForEveryone: false,
  });
  return uniqueSenders.length;
};
// ================= DELETE FOR ME (SAFE) =================
exports.deleteMessageForMe = async (userId, messageId) => {
  const msg = await Message.findById(messageId);
  if (!msg) throw new Error("Message not found");

  if (msg.senderId.toString() === userId) {
    msg.deletedForSender = true;
  } else if (msg.receiverId.toString() === userId) {
    msg.deletedForReceiver = true;
  } else {
    throw new Error("Unauthorized");
  }

  await msg.save();
  return msg;
};

// ================= DELETE FOR EVERYONE =================
exports.deleteMessageForEveryone = async (userId, messageId) => {
  const msg = await Message.findById(messageId);
  if (!msg) throw new Error("Message not found");

  if (msg.senderId.toString() !== userId) {
    throw new Error("Unauthorized");
  }

  msg.deletedForEveryone = true;
  await msg.save();
  return msg;
};

// ================= INBOX =================

exports.getUsersWithMessages = async (userId) => {
  const messages = await Message.find({
    $or: [{ senderId: userId }, { receiverId: userId }],
    deletedForEveryone: false, 
  }).sort({ createdAt: -1 });

  const map = new Map();

  for (const m of messages) {
    const otherId = m.senderId.toString() === userId 
      ? m.receiverId.toString() 
      : m.senderId.toString();

    if (!map.has(otherId)) {
      map.set(otherId, {
        userId: otherId,
        lastMessage: m.text || (m.type === "voice" ? "🎤 Voice message" : "📩"),
        lastMessageTime: m.createdAt, 
        unreadCount: 0,
      });
    }

    if (m.receiverId.toString() === userId && !m.seen) {
      map.get(otherId).unreadCount++;
    }
  }

  const users = await User.find({
    _id: { $in: [...map.keys()] },
  }).select("_id name profilePic");

  return users.map((u) => ({
    ...u.toObject(),
    ...map.get(u._id.toString()),
  }));
};
// ================= SERVICE =================


exports.clearChatForMe = async (userId, otherUserId) => {
  console.log("🔥 CLEAR START");

  const messages = await Message.find({
    $or: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId },
    ],
  });

  console.log("📦 FOUND:", messages.length);

  for (const msg of messages) {
    if (msg.senderId.toString() === userId) {
      msg.deletedForSender = true;
    }

    if (msg.receiverId.toString() === userId) {
      msg.deletedForReceiver = true;
    }

    await msg.save();
  }

  console.log("✅ CLEAR DONE");
};


exports.getInboxBadgeCount = async (userId) => {
  const senders = await Message.distinct("senderId", {
    receiverId: userId,
    seen: false,
    deletedForReceiver: false,
    deletedForEveryone: false,
  });

  return senders.length; 
};