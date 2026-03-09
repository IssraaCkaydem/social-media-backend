
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 👇 نوع الرسالة
    type: {
      type: String,
      enum: ["text", "voice"],
      default: "text",
    },

    // نص (بس إذا type = text)
    text: {
      type: String,
      default: "",
    },

    // صوت (بس إذا type = voice)
    audioUrl: {
      type: String,
      default: "",
    },

    audioDuration: {
      type: Number, // بالثواني
      default: 0,
    },

    seen: {
      type: Boolean,
      default: false,
    },

    deletedForSender: {
      type: Boolean,
      default: false,
    },
    deletedForReceiver: {
      type: Boolean,
      default: false,
    },
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
