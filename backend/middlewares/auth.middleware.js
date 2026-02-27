const jwt = require("jsonwebtoken");
const User = require("../models/user.models");

exports.verifyJWT = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return res.status(401).json({ msg: "Unauthorized  no token" });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded._id).select("-password");
    if (!user) return res.status(401).json({ msg: "Unauthorized  user not found" });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res.status(401).json({ msg: "Access token expired", expired: true });

    return res.status(401).json({ msg: "Unauthorized  invalid token" });
  }
};