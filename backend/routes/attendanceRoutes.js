const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const { authMiddleware } = require("../middleware/auth");

// Submit attendance
router.post("/", authMiddleware, async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const existing = await Attendance.findOne({
    user: req.user._id,
    date: today,
  });

  if (existing) {
    return res
      .status(400)
      .json({ message: "Attendance already submitted for today" });
  }

  const newEntry = new Attendance({
    user: req.user._id,
    date: today,
    status: req.body.status,
    reason: req.body.reason || null,
  });

  await newEntry.save();
  res.status(201).json({ message: "Attendance submitted" });
});

// Check if attendance already submitted
router.get("/check", authMiddleware, async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const existing = await Attendance.findOne({
    user: req.user._id,
    date: today,
  });
  res.json({ submitted: !!existing });
});

// ✅ New: Get total present count for all users (admin use)
router.get("/all", async (req, res) => {
  try {
    const all = await Attendance.find({ status: "Present" });
    const counts = {};
    all.forEach((a) => {
      const id = a.user.toString();
      counts[id] = (counts[id] || 0) + 1;
    });
    res.json(counts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch attendance counts" });
  }
});

module.exports = router;
