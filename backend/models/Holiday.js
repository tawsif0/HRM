// models/Holiday.js
const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema({
  weekend: { type: String, default: "Friday" },
  holidays: [String], // Dates in YYYY-MM-DD format
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Holiday", holidaySchema);
