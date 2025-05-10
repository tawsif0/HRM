const express = require("express");
const Task = require("../models/Task");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

// Create Task (only task creators can create tasks)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("assignedTo")
      .populate("createdBy");
    console.log("Fetched tasks:", tasks); // Log fetched tasks
    res.status(200).json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err); // Log the error
    res
      .status(500)
      .json({ message: "Error fetching tasks", error: err.message });
  }
});
module.exports = router;
