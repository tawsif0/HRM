const express = require("express");
const Task = require("../models/Task");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate({
        path: "assignedTo", // Populate the assignedTo field
        populate: { path: "role" }, // Then populate the role field inside assignedTo
      })
      .populate("createdBy")
      .lean(); // Convert to plain JS objects

    // Optionally, you can ensure that the file is included in the task
    tasks.forEach((task) => {
      task.file = task.file ? task.file : null; // Ensure the 'file' field is returned if it exists
    });

    res.status(200).json(tasks);
  } catch (err) {
    console.error("Database Error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch tasks", error: err.message });
  }
});

module.exports = router;
