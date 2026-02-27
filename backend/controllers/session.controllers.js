const Session = require("../models/session.models");

// ── GET current user's sessions
exports.getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user._id }).sort({
      lastUsedAt: -1,
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ── Logout a specific device
exports.logoutDevice = async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.user._id, // Ensure users can only delete their own sessions
    });

    if (!session) return res.status(404).json({ msg: "Session not found" });

    await session.deleteOne();
    res.json({ msg: "Device logged out" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ── Logout all devices
exports.logoutAll = async (req, res) => {
  try {
    await Session.deleteMany({ user: req.user._id });
    res
      .clearCookie("accessToken")
      .clearCookie("refreshToken")
      .json({ msg: "All devices logged out" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
