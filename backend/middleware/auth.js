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

    const userId = decoded.id || decoded._id;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token structure" });
    }

    const user = await User.findById(userId).populate("role");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach the user to the request object
    req.user = user;

    // Define canViewRoles flag for task creators
    if (req.user.isTaskCreator) {
      req.user.canViewRoles = true; // Allow task creators to view roles
    }

    console.log("User data:", req.user); // Log user data for debugging

    next();
  } catch (err) {
    console.error("Auth error:", err.message || err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Middleware to allow only admins or task creators
const adminMiddleware = (req, res, next) => {
  // Check if the user is either an admin or a task creator
  if (
    !req.user?.isAdminPermanent &&
    (!req.user.role || req.user.role.name !== "admin") &&
    !req.user?.isTaskCreator
  ) {
    return res
      .status(403)
      .json({ message: "Admin or Task Creator privileges required" });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
};
