const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Role = require("../models/Role");

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = new User({
      fullName,
      email,
      phone,
      password,
      notifications: true,
    });
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const adminRole = await Role.findOne({ name: "admin" });
      user.role = adminRole._id;
      user.isAdminPermanent = true;
    }

    await user.save();
    res
      .status(201)
      .json({ message: "User registered successfully, wait for the role" });
  } catch (err) {
    res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate("role");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (!user.isAdminPermanent && !user.isRoleAssigned) {
      return res.status(403).json({ message: "Wait for role assignment" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isAdminPermanent: user.isAdminPermanent,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
