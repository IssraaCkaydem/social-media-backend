<<<<<<< HEAD

// ================= server.js =================
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
require("dotenv").config({ path: "./secret.env" });

// ================= Middleware =================
app.use(express.json());
const cookieParser = require("cookie-parser");
app.use(cookieParser());

const cors = require("cors");
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// ================= Database =================
const mongoose = require("mongoose");

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mcrtib2.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ Mongo error:", err));

// ================= Routes =================
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/follow", require("./routes/followRoutes"));
app.use("/api/users2", require("./routes/userRouteV2"));
app.use("/api/comments", require("./routes/commentRoutes"));
app.use("/api/messages", require("./routes/message.routes"));
app.use("/api", require("./routes/uploadRoutes"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= Server + Socket =================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

// 🔥 لحتى نستخدم io داخل controller
app.set("io", io);

// ================= Socket Logic =================
io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id);

  // ================= JOIN ROOM =================
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined room`);
  });

  // ================= SEND MESSAGE =================

  // ================= SEND MESSAGE =================
socket.on("sendMessage", async (msg) => {

  // ✅ لا تحفظ بالـ DB هون
  // الحفظ صار عبر REST controller فقط

  io.to(msg.receiverId).emit("newMessage", msg);

  // optional: إذا بدك تبعت unread count
  const messageService = require("./services/message.service");
  const unreadCount = await messageService.getUnreadCount(msg.receiverId);
  io.to(msg.receiverId).emit("unreadCount", unreadCount);
});

  // ================= DELETE MESSAGE =================
  socket.on("deleteMessage", ({ messageId, senderId, receiverId }) => {
    io.to(receiverId).emit("deleteMessage", messageId);
    io.to(senderId).emit("deleteMessage", messageId);
  });

  // ================= TYPING =================
  socket.on("typing", ({ senderId, receiverId }) => {
    io.to(receiverId).emit("typing", senderId);
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    io.to(receiverId).emit("stopTyping", senderId);
  });

  // ================= 🎤 RECORDING =================
  socket.on("recording", ({ senderId, receiverId }) => {
    io.to(receiverId).emit("recording", senderId);
  });

  socket.on("stopRecording", ({ senderId, receiverId }) => {
    io.to(receiverId).emit("stopRecording", senderId);
  });

  // ================= 🔵 SEEN EVENT + UNREAD COUNT =================
  socket.on("messagesSeen", async ({ senderId, receiverId }) => {
    const messageService = require("./services/message.service");

    // تحديث الرسائل كمقروءة
    await messageService.markMessagesAsSeen(receiverId, senderId);

    // جلب عدد الرسائل غير المقروءة بعد التحديث
    const unreadCount = await messageService.getUnreadCount(senderId);

    // إرسال عدد الرسائل غير المقروءة للـ sender
    io.to(senderId).emit("unreadCount", unreadCount);

    // إعلام receiver أن الرسائل تمت قراءتها
    io.to(receiverId).emit("messagesSeen", { seenBy: receiverId });
  });

  // ================= DISCONNECT =================
  socket.on("disconnect", () => {
    console.log("🔴 Disconnected:", socket.id);
  });
});

// ================= Start =================
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});

=======
const express=require("express")
const app=express()


app.use(express.json());



const cookieParser = require("cookie-parser");
app.use(cookieParser());



const cors = require('cors');

app.use(cors({
  origin: /localhost:\d{4}/,  
  credentials: true           
}));




const mongoose = require("mongoose");
require('dotenv').config({ path: './secret.env' });
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbName = process.env.DB_NAME;
mongoose.connect(`mongodb+srv://${dbUser}:${dbPass}@cluster0.mcrtib2.mongodb.net/${dbName}?retryWrites=true&w=majority`)
.then(() => console.log("Connected successfully"))
.catch((error) => console.log("Error with connection", error));




const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

const postRoutes = require("./routes/postRoutes");
app.use("/api/posts", postRoutes);




const uploadRoutes = require("./routes/uploadRoutes");
app.use("/api", uploadRoutes);

const followRoutes=require("./routes/followRoutes")
app.use("/api/follow", followRoutes);


const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const userRoutes2=require("./routes/userRouteV2");
app.use("/api/users2", userRoutes2);

const commentRoutes = require("./routes/commentRoutes");
app.use("/api/comments", commentRoutes);



const PORT= process.env.PORT || 4000;
app.listen(PORT,()=>{console.log(`Server is running on port ${PORT} `)})
>>>>>>> 487d287d610ecf32cf17e5481b47ab57ccc35bde
