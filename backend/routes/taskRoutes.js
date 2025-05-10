const express = require("express");
const Task = require("../models/Task");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  if (!req.user.isTaskCreator) {
    return res
      .status(403)
      .json({ message: "Only task creators can create tasks." });
  }

  try {
    const { name, description, expireDate, assignedTo } = req.body;

    // Create a new task with provided data
    const task = new Task({
      name,
      description,
      createdBy: req.user._id,
      assignedTo,
      expireDate
    });

    await task.save();
    res.status(201).json(task); // Respond with the created task
  } catch (err) {
    console.error("Error creating task:", err);
    res
      .status(500)
      .json({ message: "Error creating task", error: err.message });
  }
});

// Fetch all tasks (including the assignee and creator)

// Modify Task (task creators can modify their tasks)
router.put("/modify/:taskId", authMiddleware, async (req, res) => {
  const { taskId } = req.params;
  const { name, description, expireDate, assignedTo } = req.body;

  try {
    const task = await Task.findById(taskId);
    if (!task || task.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(404)
        .json({ message: "Task not found or unauthorized" });
    }

    // Update task properties if provided
    task.name = name || task.name;
    task.description = description || task.description;
    task.expireDate = expireDate || task.expireDate;
    task.assignedTo = assignedTo || task.assignedTo; // Update assignedTo if provided

    await task.save();
    res.status(200).json(task);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error modifying task", error: err.message });
  }
});

// Mark Task as Half-Complete
router.put("/half-complete/:taskId", authMiddleware, async (req, res) => {
  const { taskId } = req.params;
  const { completionLink, completionDescription } = req.body;

  try {
    const task = await Task.findById(taskId);
    if (!task || task.assignedTo.toString() !== req.user._id.toString()) {
      return res
        .status(404)
        .json({ message: "Task not found or unauthorized" });
    }

    task.isHalfCompleted = true;
    task.completionLink = completionLink;
    task.completionDescription = completionDescription;
    await task.save();
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({
      message: "Error marking task as half-complete",
      error: err.message
    });
  }
});

// Complete Task
router.put("/complete/:taskId", authMiddleware, async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await Task.findById(taskId);
    if (!task || task.assignedTo.toString() !== req.user._id.toString()) {
      return res
        .status(404)
        .json({ message: "Task not found or unauthorized" });
    }

    task.isCompleted = true;
    await task.save();
    res.status(200).json(task);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error completing task", error: err.message });
  }
});

// Get Tasks for Current User
router.get("/user-tasks", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id });
    res.status(200).json(tasks);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching tasks", error: err.message });
  }
});

module.exports = router;
