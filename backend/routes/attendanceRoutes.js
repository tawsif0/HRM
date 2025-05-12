const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const { authMiddleware } = require("../middleware/auth");

// Utility to get YYYY-MM-DD from Date
// Helper function to normalize date (strip time part)
const getTodayDate = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

router.post("/", authMiddleware, async (req, res) => {
  try {
    const today = getTodayDate();
    const { status, reason, timestamp } = req.body;

    // Check if already submitted today
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
      status,
      reason: status === "Absent" ? reason : null,
      date: today, // UTC-normalized date
      attendanceTime: timestamp, // BD local time from frontend
    });

    await newEntry.save();
    res.status(201).json({ message: "Attendance submitted" });
  } catch (err) {
    console.error("Attendance error:", err);
    res.status(500).json({ message: "Failed to submit attendance" });
  }
});

// ✅ Check if attendance already submitted
router.get("/check", authMiddleware, async (req, res) => {
  try {
    const today = getTodayDate();
    const existing = await Attendance.findOne({
      user: req.user._id,
      date: today,
    });
    res.json({ submitted: !!existing });
  } catch (err) {
    res.status(500).json({ message: "Failed to check attendance" });
  }
});

// ✅ Admin: Get present counts for all users
router.get("/all", authMiddleware, async (req, res) => {
  try {
    const presentRecords = await Attendance.find({ status: "Present" });
    const counts = {};
    presentRecords.forEach((a) => {
      const userId = a.user.toString();
      counts[userId] = (counts[userId] || 0) + 1;
    });
    res.json(counts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch attendance counts" });
  }
});
// ✅ Get logged-in user's full attendance history
router.get("/user/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const attendance = await Attendance.find({ user: userId }).sort({
      date: 1,
    });
    res.status(200).json(attendance);
  } catch (err) {
    console.error("Error fetching attendance for self:", err);
    res.status(500).json({ message: "Failed to fetch self attendance" });
  }
});
// ✅ Admin: Get all attendance records for a user (used for calendar)
// Get full attendance history for a specific user
router.get("/user/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;

    const attendance = await Attendance.find({ user: userId }).sort({
      date: 1,
    });

    res.status(200).json(attendance);
  } catch (err) {
    console.error("Error fetching attendance for user:", err);
    res.status(500).json({ message: "Failed to fetch attendance" });
  }
});

module.exports = router;
