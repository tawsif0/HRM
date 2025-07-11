const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["Present", "Absent"],
    required: true
  },
  reason: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now // server timestamp (UTC)
  },
  attendanceTime: {
    type: String, // stores BD local time as string, e.g., "5/7/2025, 10:00:00 PM"
    required: true
  }
});

module.exports = mongoose.model("Attendance", attendanceSchema);
