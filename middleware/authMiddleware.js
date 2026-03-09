const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  try {
    // ✅ الاسم الصح
    const token = req.cookies.accessToken;
    console.log("ACCESS TOKEN:", token);

    if (!token) {
      return res.status(401).json({ msg: "No access token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ مهم
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid or expired access token" });
  }
};
