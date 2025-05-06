const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to verify user token and attach user object
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authorization required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate("role");

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
};

// Middleware to allow only permanent or assigned admins
const adminMiddleware = (req, res, next) => {
  if (
    !req.user.isAdminPermanent &&
    (!req.user.role || req.user.role.name !== "admin")
  ) {
    return res.status(403).json({ message: "Admin privileges required" });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
};
