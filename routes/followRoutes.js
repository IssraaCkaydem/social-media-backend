const express = require("express");
const router = express.Router();

const { followUser, unfollowUser,getFollowers, getFollowing } = require("../controllers/followController");
const { verifyToken } = require("../middleware/authMiddleware");


router.post("/follow/:id", verifyToken, followUser);
router.delete("/unfollow/:id", verifyToken, unfollowUser);
router.get("/:id/followers", getFollowers);

router.get("/:id/following", getFollowing);

module.exports = router;