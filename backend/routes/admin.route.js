const router = require("express").Router();
const { verifyJWT } = require("../middlewares/auth.middleware");
const { verifyRole } = require("../middlewares/role.middleware");
const ac = require("../controllers/admin.controllers");

const adminGuard = [verifyJWT, verifyRole("admin")];

// Session management
router.get("/sessions", ...adminGuard, ac.getAllSessions);
router.delete("/logout/:userId", ...adminGuard, ac.forceLogoutUser);
router.patch("/sessions/:sessionId/suspicious", ...adminGuard, ac.toggleSuspicious);

// User management
router.get("/users", ...adminGuard, ac.getAllUsers);

// Create admin 
router.post("/create", ac.createAdmin);

module.exports = router;