const jwt = require("jsonwebtoken");
const https = require("https");
const User = require("../models/user.models");
const Session = require("../models/session.models");
const { hashToken } = require("../utils/token.utils");

// ── Geo-IP helper
const getGeoInfo = (ip) =>
  new Promise((resolve) => {
    const safeIp =
      ip === "::1" || ip === "127.0.0.1"
        ? "8.8.8.8"
        : ip.replace("::ffff:", "");

    const req = https.get(
      `https://ipapi.co/${safeIp}/json/`,
      { timeout: 3000 },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(null);
          }
        });
      },
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
  });

// ── REGISTER
exports.registerUser = async (req, res) => {
  try {
    const { username, email, fullName, password } = req.body;

    if (!username || !email || !fullName || !password)
      return res.status(400).json({ msg: "All fields are required" });

    const existedUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existedUser)
      return res.status(409).json({ msg: "Email or username already taken" });

    const user = await User.create({ username, email, fullName, password });

    res.status(201).json({
      msg: "Registration successful",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ── LOGIN
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ msg: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid)
      return res.status(401).json({ msg: "Invalid credentials" });

    const clientIp = req.ip;
    let isSuspicious = false;

    const geoInfo = await getGeoInfo(clientIp);
    const country = geoInfo?.country_name ?? "Unknown";

    if (
      user.lastLoginIP &&
      user.lastLoginIP !== clientIp &&
      user.lastLoginCountry &&
      user.lastLoginCountry !== country
    ) {
      isSuspicious = true;
    }
    user.lastLoginIP = clientIp;
    user.lastLoginCountry = country;
    await user.save({ validateBeforeSave: false });

    // ── Token generation
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    const hashedToken = hashToken(refreshToken);

    // ── Concurrent session limit (max 3)
    const activeSessions = await Session.find({ user: user._id }).sort({
      createdAt: 1,
    });
    if (activeSessions.length >= 3) {
      await Session.findByIdAndDelete(activeSessions[0]._id);
    }

    // ── Create new session
    await Session.create({
      user: user._id,
      refreshTokenHash: hashedToken,
      deviceName: req.headers["sec-ch-ua-platform"] ?? "Unknown",
      ipAddress: clientIp,
      country,
      userAgent: req.headers["user-agent"],
      isSuspicious,
    });

    const cookieOpts = {
      httpOnly: true,
      sameSite: "strict",
    };

    return res
      .cookie("accessToken", accessToken, {
        ...cookieOpts,
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        ...cookieOpts,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        msg: "Login successful",
        isSuspicious,
        country,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ── REFRESH
exports.refreshAccessToken = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken;
    if (!incomingRefreshToken)
      return res.status(401).json({ msg: "Refresh token required" });

    let decoded;
    try {
      decoded = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET,
      );
    } catch {
      return res.status(401).json({ msg: "Invalid or expired refresh token" });
    }

    const hashedToken = hashToken(incomingRefreshToken);
    const existingSession = await Session.findOne({
      refreshTokenHash: hashedToken,
    });

    // ── Token reuse detection 
    if (!existingSession) {
      await Session.deleteMany({ user: decoded._id });
      return res
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .status(401)
        .json({ msg: "Token reuse detected. All sessions invalidated." });
    }

    const user = await User.findById(existingSession.user);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // ── Rotate tokens 
    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    existingSession.refreshTokenHash = hashToken(newRefreshToken);
    existingSession.lastUsedAt = new Date();
    await existingSession.save();

    const cookieOpts = {
      httpOnly: true,
      sameSite: "strict",
    };

    return res
      .cookie("accessToken", newAccessToken, {
        ...cookieOpts,
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", newRefreshToken, {
        ...cookieOpts,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ msg: "Token rotated" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ── LOGOUT
exports.logoutUser = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken;
    if (incomingRefreshToken) {
      const hashedToken = hashToken(incomingRefreshToken);
      await Session.findOneAndDelete({ refreshTokenHash: hashedToken });
    }

    return res
      .clearCookie("accessToken")
      .clearCookie("refreshToken")
      .json({ msg: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    res.json({
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ── VERIFY
exports.verifySuspiciousLogin = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken;
    if (!incomingRefreshToken)
      return res.status(401).json({ msg: "Not authenticated" });

    const hashedToken = hashToken(incomingRefreshToken);
    const session = await Session.findOne({ refreshTokenHash: hashedToken });
    if (!session) return res.status(404).json({ msg: "Session not found" });

    session.isSuspicious = false;
    await session.save();

    res.json({ msg: "Session verified" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
