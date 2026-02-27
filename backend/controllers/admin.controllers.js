const Session = require("../models/session.models");
const User = require("../models/user.models");

// ── GET all active sessions (across all users) 
exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate("user", "username email role lastLoginIP lastLoginCountry")
      .sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ── Force logout a specific user from all devices 
exports.forceLogoutUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    await Session.deleteMany({ user: userId });
    res.json({ msg: `All sessions for ${user.email} have been terminated` });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ── Create an admin account (super-protected) 
exports.createAdmin = async (req, res) => {
  try {
    const { username, email, fullName, password, adminSecret } = req.body;

    
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ msg: "Invalid admin secret" });
    }

    if (!username || !email || !fullName || !password)
      return res.status(400).json({ msg: "All fields are required" });

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists)
      return res.status(409).json({ msg: "Email or username already taken" });

    const admin = await User.create({
      username,
      email,
      fullName,
      password,
      role: "admin",
    });

    res.status(201).json({
      msg: "Admin account created",
      admin: {
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ── Get all users (admin overview) ───────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ── Mark a session as suspicious / clear it ──────────────────────────────────
exports.toggleSuspicious = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ msg: "Session not found" });

    session.isSuspicious = !session.isSuspicious;
    await session.save();
    res.json({ msg: "Session updated", isSuspicious: session.isSuspicious });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
