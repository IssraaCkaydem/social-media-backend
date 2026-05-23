


const router = require("express").Router();
const auth = require("../middleware/authMiddleware").verifyToken;
const c = require("../controllers/message.controller");
const uploadVoice = require("../middleware/uploadVoice"); 
const uploadImage = require("../middleware/uploadImage"); 
// ================= SEND ROUTES =================

router.post("/", auth, c.sendMessage);

router.post("/voice", auth, uploadVoice.single("voice"), c.sendVoiceMessage);

router.post("/image", auth, uploadImage.single("image"), c.sendImageMessage); 
router.post("/story-reply", auth, c.replyToStory);
// ================= GET ROUTES =================
router.get("/users", auth, c.getUsersWithMessages);
router.get("/inbox-badge", auth, c.getInboxBadgeCount);

// CHAT
router.get("/:userId", auth, c.getMessagesWithUser);
router.put("/seen/:userId", auth, c.markAsSeen);

// ================= DELETE ROUTES =================
router.delete("/me/:messageId", auth, c.deleteMessageForMe);
router.delete("/everyone/:messageId", auth, c.deleteMessageForEveryone);
router.delete("/clear/:userId", auth, c.clearChatForMe);

module.exports = router;