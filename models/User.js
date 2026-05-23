
 

 const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    followers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],

    following: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],

    profilePic: {
      type: String,
      default: "",
    },

    refreshToken: {
      type: String,
    },

    isOnline: { type: Boolean, default: false },
lastSeen: { type: Date, default: Date.now },
    // ===== 🔐 حماية تسجيل الدخول =====

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ✅ Virtual field للتحقق إذا الحساب محظور
userSchema.virtual("isLocked").get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

const User = mongoose.model("User", userSchema);

module.exports = User;