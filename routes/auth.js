
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const { registerValidation, loginValidation } = require("../middleware/validation");
const { validationResult } = require("express-validator");
const { verifyToken } = require("../middleware/authMiddleware");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array().map(e => e.msg) });
  next();
};

router.post("/register", registerValidation, handleValidationErrors, authController.registerUser);

router.post(
  "/login",
  loginValidation,
  handleValidationErrors,
  authController.loginUser
);

router.get("/check", authController.checkAuth);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logoutUser);
router.get("/me", verifyToken, authController.getCurrentUser);



module.exports = router;
