const router = require("express").Router();
const authController = require("../controllers/auth.controllers");
const { verifyJWT } = require("../middlewares/auth.middleware");

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/refresh", authController.refreshAccessToken);
router.post("/logout", authController.logoutUser);

// Protected
router.get("/me", verifyJWT, authController.getMe);
router.post("/verify-login", authController.verifySuspiciousLogin);

module.exports = router;