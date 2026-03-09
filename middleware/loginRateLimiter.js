const User = require("../models/User");

async function loginRateLimiter(req, res, next) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  // تحقق من البلوك قبل أي محاولة login
  if (user.blockExpires && user.blockExpires > new Date()) {
    const remaining = Math.ceil((user.blockExpires - new Date()) / 1000 / 60);
    return res.status(403).json({ message: `Account locked. Try again in ${remaining} minutes.` });
  }

  req.userRecord = user; // نرسل user للـ controller
  next();
}

module.exports = loginRateLimiter;