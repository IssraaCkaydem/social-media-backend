

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config({ path: "./secret.env" });

const User = require("./models/User"); 

const app = express();

// ================= 1. MIDDLEWARE =================
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= 2. SERVER & SOCKET SETUP =================
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

app.set("io", io);

// ================= 3. ROUTES =================
app.use("/api/stories", require("./routes/storyRoutes"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/follow", require("./routes/followRoutes"));
app.use("/api/comments", require("./routes/commentRoutes"));
app.use("/api/messages", require("./routes/message.routes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/users2", require("./routes/userRouteV2"));

// ================= 4. DATABASE CONNECTION =================

/*
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mcrtib2.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
*/


mongoose
  .connect("mongodb://127.0.0.1:27017/mydb")
  .then(async () => {
    console.log("✅ MongoDB Connected");
    await User.updateMany({}, { isOnline: false });
    console.log("✅ All users status reset to offline.");
  })
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ================= 5. SOCKET EVENTS & DATA =================
let onlineUsers = new Map(); 
const roomUsers = new Map(); 
const activeWatchSessions = new Map();

io.on("connection", (socket) => {
  console.log("🟢 New Connection:", socket.id);

  socket.on("join", async (userId) => {
    if (!userId) return;
    socket.join(userId);
    socket.userId = userId;
    
    onlineUsers.set(userId, socket.id);
    
    try {
      await User.findByIdAndUpdate(userId, { isOnline: true });

      socket.emit("getOnlineUsers", Array.from(onlineUsers.keys()));

      socket.broadcast.emit("userStatusChanged", { userId, isOnline: true });
      
      console.log(`👤 User ${userId} is ONLINE`);
    } catch (err) {
      console.error("Error updating online status:", err);
    }
  });

  // 
  // ================= 🔥 START: GROUP WATCH EVENTS =================
socket.on("sendGroupWatchInvite", ({ senderId, receiverId, postId, senderName, roomId }) => {
  
  console.log(`📨 Sending group invite for room: ${roomId}`);

  io.to(receiverId).emit("receiveGroupWatchInvite", {
    senderId,
    senderName,
    postId,
    roomId: roomId 
  });
});

  socket.on("acceptGroupWatchInvite", ({ senderId, receiverId, postId, roomId }) => {
    activeWatchSessions.set(roomId, { senderId, receiverId, postId, startTime: new Date() });
    io.to(senderId).emit("inviteAccepted", { roomId, postId });
  });

  socket.on("joinWatchRoom", ({ roomId, userId, userName, profilePic }) => { 
    console.log(`📡 [SERVER] Join room: ${roomId} by ${userName}`);
    socket.join(roomId);
    socket.currentRoom = roomId;

    if (!roomUsers.has(roomId)) roomUsers.set(roomId, []);
    
    const usersInRoom = roomUsers.get(roomId);
    
    const userIndex = usersInRoom.findIndex(u => u.userId === userId);

    if (userIndex === -1) {
      usersInRoom.push({ userId, userName, profilePic, socketId: socket.id });
    } else {
      usersInRoom[userIndex].socketId = socket.id;
      usersInRoom[userIndex].profilePic = profilePic;
    }

    io.to(roomId).emit("roomUsersUpdate", usersInRoom);
});

  socket.on("sendLiveComment", (data) => {
    if (data.roomId) {
      io.to(data.roomId).emit("receiveLiveComment", {
        ...data,
        createdAt: new Date()
      });
    }
  });

  socket.on("typingLiveComment", ({ roomId, userName }) => {
    socket.to(roomId).emit("userTyping", { userName });
  });

  socket.on("sendLiveReaction", ({ roomId, senderId, emoji }) => {
    io.to(roomId).emit("receiveLiveReaction", { senderId, emoji });
  });

  socket.on("leaveWatchSession", ({ roomId, userId }) => {
    socket.leave(roomId);
    if (roomUsers.has(roomId)) {
      const updated = roomUsers.get(roomId).filter(u => u.userId !== userId);
      roomUsers.set(roomId, updated);
      io.to(roomId).emit("roomUsersUpdate", updated);
    }
  });

  // ================= 💬 START: DIRECT MESSAGING =================
  socket.on("sendMessage", (msg) => {
    if (msg.receiverId) {
      io.to(msg.receiverId).emit("newMessage", msg);
    }
  });

  socket.on("typing", ({ senderId, receiverId }) => {
    io.to(receiverId).emit("typing", { senderId });
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    io.to(receiverId).emit("stopTyping", { senderId });
  });

  socket.on("recording", ({ senderId, receiverId }) => {
    io.to(receiverId).emit("recording", { senderId });
  });

  socket.on("messagesSeen", ({ senderId, receiverId }) => {
    io.to(senderId).emit("messagesSeen", { readerId: receiverId });
  });

  // ================= 🛑 DISCONNECT =================
  socket.on("disconnect", async () => {
    const userId = socket.userId;
    const roomId = socket.currentRoom;

    if (roomId && roomUsers.has(roomId)) {
      const updated = roomUsers.get(roomId).filter(u => u.socketId !== socket.id);
      roomUsers.set(roomId, updated);
      io.to(roomId).emit("roomUsersUpdate", updated);
    }

    if (userId) {
      onlineUsers.delete(userId);
      try {
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
        io.emit("userStatusChanged", { userId, isOnline: false });
        console.log(`🔴 User ${userId} is OFFLINE`);
      } catch (err) { console.error(err); }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});