// routes/tasks.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { authMiddleware } = require("../middleware/auth");
const Task = require("../models/Task");

// Download file route
router.get("/download/:taskId", authMiddleware, async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user._id || req.user.id; // authMiddleware should set req.user

  try {
    // Find task and verify permission
    const task = await Task.findOne({
      _id: taskId,
      $or: [{ createdBy: userId }, { assignedTo: userId }],
    });

    if (!task || !task.file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Construct the file path
    const uploadsDir = path.join(process.cwd(), "uploads");
    const filePath = path.join(uploadsDir, task.file);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    // Use the stored filename (task.file) as the download name
    const downloadName = task.file;

    return res.download(filePath, downloadName, (err) => {
      if (err) {
        console.error("Error in res.download:", err);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error sending file" });
        }
      }
    });
  } catch (err) {
    console.error("Download error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
