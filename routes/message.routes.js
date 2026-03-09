const router = require("express").Router();
const auth = require("../middleware/authMiddleware").verifyToken;
const messageController = require("../controllers/message.controller");
const uploadVoice = require("../middleware/uploadVoice");

// =======================
// SEND TEXT MESSAGE
// =======================
router.post("/", auth, messageController.sendMessage);

// =======================
// SEND VOICE MESSAGE
// =======================
router.post(
  "/voice",
  auth,
  uploadVoice.single("voice"),
  messageController.sendVoiceMessage
);

// =======================
// DELETE MESSAGE
// =======================
router.delete("/me/:messageId", auth, messageController.deleteMessageForMe);
router.delete(
  "/everyone/:messageId",
  auth,
  messageController.deleteMessageForEveryone
);

// =======================
// INBOX
// =======================
router.get("/users", auth, messageController.getUsersWithMessages);
router.get("/:userId", auth, messageController.getMessagesWithUser);

// =======================
// 🔥 MARK AS SEEN
// =======================
router.put("/seen/:userId", auth, messageController.markAsSeen);

module.exports = router;
