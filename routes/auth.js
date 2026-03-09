
<<<<<<< HEAD

=======
>>>>>>> 487d287d610ecf32cf17e5481b47ab57ccc35bde
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const { registerValidation, loginValidation } = require("../middleware/validation");
const { validationResult } = require("express-validator");
<<<<<<< HEAD
const { verifyToken } = require("../middleware/authMiddleware");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array().map(e => e.msg) });
  next();
};

router.post("/register", registerValidation, handleValidationErrors, authController.registerUser);

// ✅ إضافة loginRateLimiter قبل authController.loginUser
=======

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array().map(err => err.msg) });
  }
  next();
};

// ✅ Register Route
router.post(
  "/register",
  registerValidation,
  handleValidationErrors,
  authController.registerUser
);

// ✅ Login Route
>>>>>>> 487d287d610ecf32cf17e5481b47ab57ccc35bde
router.post(
  "/login",
  loginValidation,
  handleValidationErrors,
  authController.loginUser
);

router.get("/check", authController.checkAuth);
<<<<<<< HEAD
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logoutUser);
router.get("/me", verifyToken, authController.getCurrentUser);



module.exports = router;
=======
router.post("/logout", authController.logoutUser);

module.exports = router;
>>>>>>> 487d287d610ecf32cf17e5481b47ab57ccc35bde
