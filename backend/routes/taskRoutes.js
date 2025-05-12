const express = require("express");
const Task = require("../models/Task");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();
const upload = require("../config/multerConfig"); // Import the Multer middleware
const fs = require("fs");
// Backend (Express.js route)
router.get("/:userId", authMiddleware, async (req, res) => {
  const { userId } = req.params; // Get the userId from the URL parameter

  const tasks = await Task.find({ assignedTo: userId });

  // If no tasks are found, return an empty array instead of an error
  if (tasks.length === 0) {
    return res.status(200).json([]); // Return an empty array
  }

  res.status(200).json(tasks); // Return tasks assigned to the user
});

router.post("/", authMiddleware, upload.single("file"), async (req, res) => {
  if (!req.user.isTaskCreator) {
    return res
      .status(403)
      .json({ message: "Only task creators can create tasks." });
  }

  try {
    const { name, description, expireDate, assignedTo } = req.body;
    const file = req.file ? req.file.path : null; // Get the file path if uploaded

    // Create a new task with provided data, including file path if a file is uploaded
    const task = new Task({
      name,
      description,
      createdBy: req.user._id,
      assignedTo,
      expireDate,
      file,
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
router.delete("/:taskId", authMiddleware, async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await Task.findByIdAndDelete(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if a file is associated with the task and delete it
    if (task.file) {
      const filePath = task.file; // Path to the uploaded file

      // Delete the file from the server's file system
      fs.unlinkSync(filePath); // This deletes the file from the uploads folder

      console.log(`Deleted file: ${filePath}`); // Optional: for logging purposes
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Error deleting task:", err);
    res
      .status(500)
      .json({ message: "Failed to delete task", error: err.message });
  }
});
// Modify Task (task creators can modify their tasks)
router.put(
  "/modify/:taskId",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    const { taskId } = req.params;
    const { name, description, expireDate, assignedTo } = req.body;
    const file = req.file ? req.file.path : null; // Get the new file path if uploaded

    try {
      const task = await Task.findById(taskId);
      if (!task || task.createdBy.toString() !== req.user._id.toString()) {
        return res
          .status(404)
          .json({ message: "Task not found or unauthorized" });
      }

      // If a new file is uploaded, delete the previous one
      if (file && task.file) {
        const oldFilePath = task.file;
        // Remove the previous file from the server
        fs.unlink(oldFilePath, (err) => {
          if (err) {
            console.error("Error deleting the old file:", err);
          }
        });
      }

      // Update task properties if provided
      task.name = name || task.name;
      task.description = description || task.description;
      task.expireDate = expireDate || task.expireDate;
      task.assignedTo = assignedTo || task.assignedTo;
      if (file) task.file = file; // Update file if a new file is uploaded

      await task.save();
      res.status(200).json(task);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error modifying task", error: err.message });
    }
  }
);
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

    res.status(200).json(task); // Ensure task is returned after save
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

    // Check if the task has expired
    const currentTime = new Date();
    if (currentTime > new Date(task.expireDate)) {
      task.isCompleted = true;
      task.isExpired = true; // Mark as expired
    } else {
      task.isCompleted = true;
    }

    await task.save();
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({
      message: "Error completing task",
      error: err.message,
    });
  }
});

// Get Tasks for Current User

module.exports = router;
