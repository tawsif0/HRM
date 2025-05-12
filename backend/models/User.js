const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
  isAdminPermanent: { type: Boolean, default: false },
  isRoleAssigned: { type: Boolean, default: false },
  isTaskCreator: { type: Boolean, default: false }, // Flag for Task Creator privilege
  notifications: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Password hashing before saving the user
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
