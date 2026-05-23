

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

    type: {
      type: String,
      enum: ["text", "voice", "image", "story_reply"], 
      default: "text",
    },

    text: {
      type: String,
      default: "",
    },

    storyId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Story" 
    },
    storySnapshot: { 
      type: String, 
      default: "" 
    },

    audioUrl: {
      type: String,
      default: "",
    },

    audioDuration: {
      type: Number,
      default: 0,
    },

    imageUrl: {
      type: String,
      default: "",
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