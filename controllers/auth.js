

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ===== COOKIE OPTIONS =====

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

// ===== REGISTER =====
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ msg: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });

    const accessToken = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15*60*1000 });
    res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 30*24*60*60*1000 });

    res.status(201).json({
      success: true,
      msg: "User registered successfully",
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
// LOGIN with failed attempts tracking


exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    // ✅ reset attempts if lock expired
    if (user.lockUntil && user.lockUntil < Date.now()) {
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    // 🔒 check if account still locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({
        message: "Too many login attempts. Try again later",
        blockedUntil: user.lockUntil.getTime()
      });
    }

    // 🔑 check password
    const isMatch = await bcrypt.compare(password, user.password);

    // ❌ wrong password
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      // lock after 5 attempts
      if (user.loginAttempts >= 5) {
        const lockDuration = 5 * 60 * 1000;
        //const lockDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
        user.lockUntil = new Date(Date.now() + lockDuration);

        await user.save();

        return res.status(403).json({
          message: "Too many login attempts. Try again later",
          blockedUntil: user.lockUntil.getTime()
        });
      }

      await user.save();

      return res.status(400).json({
        message: "Invalid email or password",
        attemptsLeft: 5 - user.loginAttempts
      });
    }

    // ✅ successful login
    user.loginAttempts = 0;
    user.lockUntil = null;

    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};
// ===== CHECK AUTH =====
exports.checkAuth = (req, res) => {
  const token = req.cookies?.accessToken;
  if (!token) return res.json({ authenticated: false, needRefresh: true });

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ authenticated: true });
  } catch {
    res.json({ authenticated: false, needRefresh: true });
  }
};

// ===== REFRESH TOKEN =====
exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken)
      return res.status(401).json({ message: "No refresh token" });

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    return res.json({ success: true });
  } catch (err) {
    return res.status(403).json({ message: "Refresh failed" });
  }
};

// ===== LOGOUT =====
exports.logoutUser = async (req, res) => {
  try {
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Logout failed", error: err.message });
  }
};

// ===== GET CURRENT USER =====
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id; // موجود من verifyToken
    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



