const express = require("express");
const router = express.Router();
const Holiday = require("../models/Holiday");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

// GET: All users can view holidays
router.get("/", authMiddleware, async (req, res) => {
  try {
    const holiday = await Holiday.findOne().sort({ createdAt: -1 });
    res.json(holiday || { weekend: "Friday", holidays: [] });
  } catch {
    res.status(500).json({ message: "Failed to fetch holidays" });
  }
});

// POST: Only admins can update holidays
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  const { weekend, holidays } = req.body;
  try {
    await Holiday.create({ weekend, holidays });
    res.status(201).json({ message: "Holiday settings saved" });
  } catch {
    res.status(500).json({ message: "Failed to save holidays" });
  }
});

module.exports = router;
