const jwt = require("jsonwebtoken");



exports.verifyToken = (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
           // return next();

    return res.status(401).json({ msg: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token is not valid" });
  }
};