const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to verify user token and attach user object
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Accept either 'id' or '_id' depending on how token was signed
    const userId = decoded.id || decoded._id;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token structure" });
    }

    const user = await User.findById(userId).populate("role");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err.message || err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Middleware to allow only permanent or assigned admins
const adminMiddleware = (req, res, next) => {
  if (
    !req.user?.isAdminPermanent &&
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
