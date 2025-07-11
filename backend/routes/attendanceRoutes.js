const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const Holiday = require("../models/Holiday");
const { authMiddleware } = require("../middleware/auth");
const moment = require("moment-timezone");
// Utility to get YYYY-MM-DD from Date
// Helper function to normalize date (strip time part)
const getTodayDate = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};
const isWeekendOrHoliday = async (date) => {
  try {
    const holidayConfig = await Holiday.findOne().sort({ createdAt: -1 });
    const { weekend, holidays } = holidayConfig || {
      weekend: "Friday",
      holidays: []
    };

    const dayOfWeek = moment(date).tz("Asia/Dhaka").day(); // 0 = Sunday, 6 = Saturday
    const isWeekend = weekend === "Friday" ? dayOfWeek === 5 : dayOfWeek === 6; // Compare with Friday/Saturday
    const isHoliday = holidays.includes(
      moment(date).tz("Asia/Dhaka").format("YYYY-MM-DD")
    );

    return isWeekend || isHoliday;
  } catch (err) {
    console.error("Error checking weekend/holiday:", err);
    return false; // Default to false if something goes wrong
  }
};
router.post("/", authMiddleware, async (req, res) => {
  try {
    const today = getTodayDate();
    const { status, reason, timestamp } = req.body;

    // Check if today is a weekend or holiday
    if (await isWeekendOrHoliday(today)) {
      return res.status(400).json({
        message: "Attendance cannot be submitted on weekends or holidays."
      });
    }

    // Check if attendance has already been submitted today
    const existing = await Attendance.findOne({
      user: req.user._id,
      date: today
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "Attendance already submitted for today" });
    }

    // Check if the time is before 6 PM BD time (auto-mark as Absent if it's after 6 PM)
    const currentTimeBD = moment().tz("Asia/Dhaka");
    const sixPMBD = moment(currentTimeBD).set({
      hour: 18,
      minute: 0,
      second: 0
    });

    if (currentTimeBD.isAfter(sixPMBD) && !status) {
      status = "Absent"; // Automatically mark as Absent if no status provided before 6 PM
      reason = "Did not submit attendance before 6 PM";
    }

    const newEntry = new Attendance({
      user: req.user._id,
      status: status || "Absent", // Default to "Absent" if no status is provided
      reason: status === "Absent" ? reason : null,
      date: today, // UTC-normalized date
      attendanceTime: timestamp // BD local time from frontend
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
      date: today
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
      date: 1
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
      date: 1
    });

    res.status(200).json(attendance);
  } catch (err) {
    console.error("Error fetching attendance for user:", err);
    res.status(500).json({ message: "Failed to fetch attendance" });
  }
});

module.exports = router;
