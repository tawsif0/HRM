const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

router.get("/profile", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("role");
  res.json(user);
});

router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;
    const user = req.user;

    if (user.role.name === "admin") {
      if (password) user.password = password; // Let pre-save hook hash it
      user.phone = phone || user.phone;
    } else {
      user.fullName = fullName || user.fullName;
      user.email = email || user.email;
      user.phone = phone || user.phone;
      if (password) user.password = password; // Let pre-save hook hash it
    }

    await user.save();
    res.json({ message: "Account updated successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error updating account settings" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const users = await User.find().populate("role");
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res
      .status(500)
      .json({ message: "Error fetching users", error: err.message });
  }
});

router.delete("/:userId", authMiddleware, adminMiddleware, async (req, res) => {
  const user = await User.findById(req.params.userId).populate("role");
  if (!user) return res.status(404).json({ message: "User not found." });
  if (user.role.name === "admin")
    return res.status(400).json({ message: "Admin users cannot be deleted." });

  await User.findByIdAndDelete(req.params.userId);
  res.json({ message: "User deleted successfully!" });
});
router.put(
  "/:userId/assign-task-creator",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Assign Task Creator privilege
      user.isTaskCreator = true;
      await user.save();

      res.json({
        message: "Task creator privilege granted successfully",
        user,
      });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error assigning task creator privilege" });
    }
  }
);

// Route to remove Task Creator privilege
router.put(
  "/:userId/remove-task-creator",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Remove Task Creator privilege
      user.isTaskCreator = false;
      await user.save();

      res.json({
        message: "Task creator privilege removed successfully",
        user,
      });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error removing task creator privilege" });
    }
  }
);

router.put(
  "/:userId/role",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const { roleId } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = roleId;
    await user.save();
    const updated = await User.findById(req.params.userId)
      .select("-password")
      .populate("role");
    res.json(updated);
  }
);

router.post(
  "/:userId/role",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const { roleId } = req.body;
    const user = await User.findById(req.params.userId);
    const role = await require("../models/Role").findById(roleId);

    if (!user || !role)
      return res.status(404).json({ message: "User or role not found" });
    if (role.name === "admin" && !user.isAdminPermanent)
      return res.status(400).json({ message: "Admin role cannot be assigned" });

    user.role = roleId;
    user.isRoleAssigned = true;
    await user.save();
    res.json({ message: "Role assigned successfully", user });
  }
);

module.exports = router;
