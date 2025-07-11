const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  expireDate: { type: Date, required: true },
  isCompleted: { type: Boolean, default: false },
  gitUrl: { type: String, required: false },
  gitDescription: { type: String, required: false },
  isHalfCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  file: { type: String, default: "" },
  completionDate: { type: String, default: null } // New field to store formatted completion date and time
});

module.exports = mongoose.model("Task", taskSchema);
