const router = require("express").Router();
const { verifyJWT } = require("../middlewares/auth.middleware");
const sc = require("../controllers/session.controllers");

router.get("/", verifyJWT, sc.getSessions);
router.delete("/all", verifyJWT, sc.logoutAll);     
router.delete("/:id", verifyJWT, sc.logoutDevice);

module.exports = router;