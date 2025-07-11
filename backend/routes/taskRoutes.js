const express = require("express");
const Task = require("../models/Task");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();
const upload = require("../config/multerConfig"); // Import the Multer middleware
const path = require("path");
const fs = require("fs"); // File system module to check file existence and serve it
const moment = require("moment-timezone");
function saveFileBuffer(taskId, file) {
  const ext = path.extname(file.originalname);
  const fileName = `${taskId}${ext}`;
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, fileName);
  fs.writeFileSync(filePath, file.buffer);
  return fileName;
}
router.get("/:userId", authMiddleware, async (req, res) => {
  const { userId } = req.params;
  const { taskId } = req.query;

  try {
    // Handle file download request
    if (taskId) {
      const task = await Task.findOne({
        _id: taskId,
        $or: [{ createdBy: userId }, { assignedTo: userId }]
      });

      if (!task || !task.file) {
        return res.status(404).json({ message: "File not found" });
      }

      // Construct absolute path to uploads directory
      const uploadsDir = path.join(process.cwd(), "uploads");
      const filePath = path.join(uploadsDir, task.file);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found on server" });
      }

      // Extract original filename with extension
      const originalFileName = task.file.split("-").slice(1).join("-");

      // Use res.download with original filename
      return res.download(filePath, originalFileName, (err) => {
        if (err && !res.headersSent) {
          res.status(500).json({
            message: "Download failed",
            error: err.message
          });
        }
      });
    }

    // Handle normal tasks request
    const tasks = await Task.find({ assignedTo: userId })
      .populate("createdBy", "fullName")
      .lean();

    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

router.post("/", authMiddleware, upload.single("file"), async (req, res) => {
  if (!req.user.isTaskCreator) {
    return res
      .status(403)
      .json({ message: "Only task creators can create tasks." });
  }

  try {
    const { name, description, expireDate, assignedTo } = req.body;

    // Create task first
    const task = new Task({
      name,
      description,
      createdBy: req.user._id,
      assignedTo,
      expireDate
    });
    await task.save();

    // Handle uploaded file
    if (req.file && req.file.buffer) {
      const fileName = saveFileBuffer(task._id, req.file);
      task.file = fileName;
      await task.save();
    }

    res.status(201).json(task);
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
    // Delete the task document
    const task = await Task.findByIdAndDelete(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // If a file is associated, delete it from uploads
    if (task.file) {
      const filePath = path.join(process.cwd(), "uploads", task.file);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        } catch (unlinkErr) {
          console.error("Error deleting file:", unlinkErr);
        }
      }
    }

    return res
      .status(200)
      .json({ message: "Task and its file deleted successfully" });
  } catch (err) {
    console.error("Error deleting task:", err);
    return res
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

    try {
      const task = await Task.findById(taskId);
      if (!task || task.createdBy.toString() !== req.user._id.toString()) {
        return res
          .status(404)
          .json({ message: "Task not found or unauthorized" });
      }

      // If a new file is uploaded, delete old and save new
      if (req.file && req.file.buffer) {
        // Delete old file if exists
        if (task.file) {
          const oldPath = path.join(process.cwd(), "uploads", task.file);
          if (fs.existsSync(oldPath)) {
            try {
              fs.unlinkSync(oldPath);
            } catch (e) {
              console.error("Failed to delete old file", e);
            }
          }
        }
        // Save new file buffer
        const newFileName = saveFileBuffer(taskId, req.file);
        task.file = newFileName;
      }

      // Update other fields
      if (name) task.name = name;
      if (description) task.description = description;
      if (expireDate) task.expireDate = expireDate;
      if (assignedTo) task.assignedTo = assignedTo;

      await task.save();
      res.status(200).json(task);
    } catch (err) {
      console.error("Error modifying task:", err);
      res
        .status(500)
        .json({ message: "Error modifying task", error: err.message });
    }
  }
);
router.get("/half-completed/:taskId", authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;

    // Find the task by ID
    const task = await Task.findById(taskId);

    // Check if the task exists and is half-completed
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!task.isHalfCompleted) {
      return res.status(200).json({ message: "Task is not half-completed" });
    }

    // If the task is half-completed, send the gitUrl and gitDescription
    return res.status(200).json({
      gitUrl: task.gitUrl,
      gitDescription: task.gitDescription
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// Mark Task as Half-Complete
router.put("/half-complete/:taskId", authMiddleware, async (req, res) => {
  const { taskId } = req.params;
  const { completionLink, completionDescription } = req.body;

  try {
    // Find the task by its ID
    const task = await Task.findById(taskId);

    // Check if the task exists and if the user is authorized to modify it
    if (!task || task.assignedTo.toString() !== req.user._id.toString()) {
      return res
        .status(404)
        .json({ message: "Task not found or unauthorized" });
    }

    // Update the task fields
    task.isHalfCompleted = true;
    task.gitUrl = completionLink; // Assuming completionLink holds the Git URL
    task.gitDescription = completionDescription; // Git commit description

    // Save the updated task
    await task.save();

    // Respond with the updated task data
    res.status(200).json({
      message: "Task marked as half-complete",
      task
    });
  } catch (err) {
    // Handle any unexpected errors
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

    // Check if the task has expired
    const currentTime = new Date();
    if (currentTime > new Date(task.expireDate)) {
      task.isCompleted = true;
      task.isExpired = true; // Mark as expired
    } else {
      task.isCompleted = true;
    }

    // Set completion date and time in Bangladesh Standard Time (BST)
    const completionDate = moment().tz("Asia/Dhaka").format(); // Format as an ISO 8601 string (YYYY-MM-DDTHH:mm:ss.sssZ)

    task.completionDate = completionDate; // Save the formatted date and time

    await task.save();
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({
      message: "Error completing task",
      error: err.message
    });
  }
});

// Get Tasks for Current User

module.exports = router;
