const express = require("express");
const path = require("path");
const fs = require("fs");
const Task = require("../models/Task"); // Ensure Task model is correctly imported
const { authMiddleware } = require("../middleware/auth"); // Middleware for authentication

const router = express.Router();

// File download route for a specific task
router.get("/:taskId", authMiddleware, async (req, res) => {
  const { taskId } = req.params; // Extract the taskId from the URL parameter

  try {
    // Find the task by taskId
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Ensure the user is authorized to download the file (only assigned users can download)
    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to download this file" });
    }

    // Construct the full file path using the 'file' field from the task (relative to the uploads directory)
    const filePath = path.join(__dirname, "..", "..", "uploads", task.file);
    console.log("File Path:", filePath); // Log the file path to ensure it's correct

    const fileName = path.basename(filePath); // Extract the file name from the path

    // Check if the file exists on the server
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error("File not found at path:", filePath); // Log if the file is not found
        return res.status(404).json({ message: "File not found" });
      }

      // Set the Content-Disposition header to indicate it's an attachment
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );

      // Send the file for download
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error("Error downloading file:", err);
          return res.status(500).json({ message: "Error downloading file" });
        }
      });
    });
  } catch (err) {
    console.error("Error fetching task:", err);
    res
      .status(500)
      .json({ message: "Error fetching task", error: err.message });
  }
});

module.exports = router;
