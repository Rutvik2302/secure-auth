const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    deviceName: { type: String, default: "Unknown" },
    ipAddress: { type: String, default: "Unknown" },
    country: { type: String, default: "Unknown" },
    userAgent: { type: String, default: "Unknown" },
    refreshTokenHash: { type: String, required: true },
    isSuspicious: { type: Boolean, default: false },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

// TTL index – MongoDB auto-deletes expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Session", sessionSchema);