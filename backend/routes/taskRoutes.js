const express = require("express");
const Task = require("../models/Task");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

// Create Task (only task creators can create tasks)
router.post("/", authMiddleware, async (req, res) => {
  if (req.user.role.name === "admin") {
    return res.status(400).json({ message: "Admins cannot create tasks." });
  }

  try {
    const { name, description, expireDate, assignedTo } = req.body;
    const task = new Task({
      name,
      description,
      createdBy: req.user._id,
      assignedTo,
      expireDate,
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating task", error: err.message });
  }
});

// Modify Task (task creators can modify their tasks)
router.put("/modify/:taskId", authMiddleware, async (req, res) => {
  const { taskId } = req.params;
  const { name, description, expireDate } = req.body;

  try {
    const task = await Task.findById(taskId);
    if (!task || task.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(404)
        .json({ message: "Task not found or unauthorized" });
    }

    task.name = name || task.name;
    task.description = description || task.description;
    task.expireDate = expireDate || task.expireDate;
    await task.save();
    res.status(200).json(task);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error modifying task", error: err.message });
  }
});

// Assign Task (task creators can assign tasks to other users)
router.put("/assign/:taskId", authMiddleware, async (req, res) => {
  const { taskId } = req.params;
  const { assignedTo } = req.body;

  try {
    const task = await Task.findById(taskId);
    if (!task || task.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(404)
        .json({ message: "Task not found or unauthorized" });
    }

    task.assignedTo = assignedTo;
    await task.save();
    res.status(200).json(task);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error assigning task", error: err.message });
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
      error: err.message,
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
