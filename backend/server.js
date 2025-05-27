require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const Role = require("./models/Role");
const holidayRoutes = require("./routes/holidayRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const taskRoutes = require("./routes/taskRoutes");
const tasksRoutes = require("./routes/tasksRoutes");
const downloadRoutes = require("./routes/downloadRoutes");
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

connectDB().then(initializeAdminRole);

async function initializeAdminRole() {
  try {
    const adminRole = await Role.findOne({ name: "admin" });
    if (!adminRole) {
      await new Role({ name: "admin", isProtected: true }).save();
      console.log("Admin role initialized");
    }
  } catch (err) {
    console.error("Role initialization error:", err);
  }
}

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes); // profile, update
app.use("/api/users", userRoutes); // list, delete, assign role
app.use("/api/roles", roleRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/task", tasksRoutes);
app.use("/api", downloadRoutes);
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
