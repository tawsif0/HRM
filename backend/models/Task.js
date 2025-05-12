const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  expireDate: { type: Date, required: true },
  isCompleted: { type: Boolean, default: false },
  isHalfCompleted: { type: Boolean, default: false },
  completionLink: { type: String, default: "" },
  completionDescription: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  file: { type: String, default: "" }, // Added file field to store file path or name
});

module.exports = mongoose.model("Task", taskSchema);
