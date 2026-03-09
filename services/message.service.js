

const Message = require("../models/Message");
const User = require("../models/User");

// =======================
// SEND TEXT MESSAGE
// =======================

exports.sendMessage = async (senderId, receiverId, text) => {
  if (!receiverId || !text) throw new Error("Missing data");

  const message = await Message.create({
    senderId,
    receiverId,
    text,
    type: "text",
    seen: false, // 🔥 جديد
    deletedForSender: false,
    deletedForReceiver: false,
    deletedForEveryone: false,
  });

  return message;
};

// =======================
// SEND VOICE MESSAGE
// =======================
exports.sendVoiceMessage = async (senderId, receiverId, voicePath) => {
  if (!receiverId || !voicePath) throw new Error("Missing data");

  const message = await Message.create({
    senderId,
    receiverId,
    type: "voice",
    audioUrl: voicePath,
    seen: false, // 🔥 جديد
    deletedForSender: false,
    deletedForReceiver: false,
    deletedForEveryone: false,
  });

  return message;
};

// =======================
// GET MESSAGES WITH USER
// =======================
exports.getMessagesWithUser = async (userId, otherUserId) => {
  return await Message.find({
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
};

// =======================
// MARK MESSAGES AS SEEN 🔥
// =======================
exports.markMessagesAsSeen = async (userId, otherUserId) => {
  const result = await Message.updateMany(
    {
      senderId: otherUserId,   // الشخص يلي باعث
      receiverId: userId,      // الشخص يلي فتح الشات
      seen: false,
      deletedForReceiver: false,
      deletedForEveryone: false,
    },
    {
      $set: { seen: true },
    }
  );

  return result;
};

// =======================
// GET UNREAD COUNT 🔥
// =======================
exports.getUnreadCount = async (userId) => {
  const count = await Message.countDocuments({
    receiverId: userId,
    seen: false,
    deletedForReceiver: false,
    deletedForEveryone: false,
  });

  return count;
};

// =======================
// DELETE FOR ME
// =======================
exports.deleteMessageForMe = async (userId, messageId) => {
  const message = await Message.findById(messageId);
  if (!message) throw new Error("Message not found");

  if (message.senderId.toString() === userId) {
    message.deletedForSender = true;
  } else if (message.receiverId.toString() === userId) {
    message.deletedForReceiver = true;
  } else {
    throw new Error("Unauthorized");
  }

  await message.save();
  return message;
};

// =======================
// DELETE FOR EVERYONE
// =======================
exports.deleteMessageForEveryone = async (userId, messageId) => {
  const message = await Message.findById(messageId);
  if (!message) throw new Error("Message not found");

  if (message.senderId.toString() !== userId) {
    throw new Error("Unauthorized");
  }

  message.deletedForEveryone = true;
  await message.save();
  return message;
};

// =======================
// GET USERS WITH MESSAGES (INBOX)
// =======================
exports.getUsersWithMessages = async (userId) => {
  const messages = await Message.find({
    $or: [
      { senderId: userId, deletedForSender: false, deletedForEveryone: false },
      { receiverId: userId, deletedForReceiver: false, deletedForEveryone: false },
    ],
  }).sort({ createdAt: -1 });

  const userIds = new Set();

  messages.forEach(msg => {
    if (msg.senderId.toString() !== userId)
      userIds.add(msg.senderId.toString());

    if (msg.receiverId.toString() !== userId)
      userIds.add(msg.receiverId.toString());
  });

  return await User.find({ _id: { $in: [...userIds] } })
    .select("_id name");
};
