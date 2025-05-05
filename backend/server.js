require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    initializeAdminRole();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Database Initialization
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

// Schemas
const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  isProtected: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
  isAdminPermanent: { type: Boolean, default: false },
  isRoleAssigned: { type: Boolean, default: false },
  notifications: { type: Boolean, default: false }, // Track if there are notifications
  createdAt: { type: Date, default: Date.now },
});

// Middleware
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Models
const Role = mongoose.model("Role", roleSchema);
const User = mongoose.model("User", userSchema);

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ message: "Authorization required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate("role");
    if (!user) return res.status(401).json({ message: "Invalid token" });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Admin Middleware
const adminMiddleware = async (req, res, next) => {
  try {
    if (
      !req.user.isAdminPermanent &&
      (!req.user.role || req.user.role.name !== "admin")
    ) {
      return res.status(403).json({ message: "Admin privileges required" });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Routes
// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = new User({
      fullName,
      email,
      phone,
      password,
      notifications: true,
    });

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const adminRole = await Role.findOne({ name: "admin" });
      user.role = adminRole._id;
      user.isAdminPermanent = true;
    }

    await user.save();

    // Notify the admin about this new registration
    // You can optionally store this notification in a separate collection if needed

    res
      .status(201)
      .json({ message: "User registered successfully , wait for the role" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate("role");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is not an admin and role is not assigned yet
    if (!user.isAdminPermanent && !user.isRoleAssigned) {
      return res.status(403).json({ message: "Wait for role assignment" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isAdminPermanent: user.isAdminPermanent,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});
// Account Settings Route
app.put("/api/user/profile", authMiddleware, async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;
    const user = req.user;

    // Check if the user is an admin
    if (user.role.name === "admin") {
      // Admins can only update phone and password
      if (password) {
        // Hash the new password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
      }

      user.phone = phone || user.phone; // Admin can update the phone number
    } else {
      // Non-admins can update fullName (username), email, phone, and password
      user.fullName = fullName || user.fullName; // Non-admin can update username
      user.email = email || user.email; // Non-admin can update email
      user.phone = phone || user.phone; // Non-admin can update phone
      if (password) {
        // Non-admins can update the password
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
      }
    }

    // Save the updated user details
    await user.save();

    res.status(200).json({ message: "Account updated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating account settings" });
  }
});
app.delete(
  "/api/users/:userId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { userId } = req.params;

      console.log("Deleting user with ID:", userId); // Log the user ID being deleted

      // Find the user by ID and populate the role to access the role details
      const userToDelete = await User.findById(userId).populate("role");

      if (!userToDelete) {
        console.error("User not found with ID:", userId);
        return res.status(404).json({ message: "User not found." });
      }

      if (userToDelete.role.name === "admin") {
        console.error("Attempted to delete an admin user.");
        return res
          .status(400)
          .json({ message: "Admin users cannot be deleted." });
      }

      // Delete the user using findByIdAndDelete instead of remove
      await User.findByIdAndDelete(userId);

      console.log("User deleted successfully with ID:", userId);

      res.status(200).json({ message: "User deleted successfully!" });
    } catch (err) {
      console.error("Error deleting user:", err); // Log the full error here
      res.status(500).json({ message: "Error deleting user" });
    }
  }
);

// User Routes
app.get("/api/user/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("role");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Profile fetch failed" });
  }
});

// Role Management
app.post("/api/roles", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    if (name.toLowerCase() === "admin") {
      // If the role is admin, check if it's already created
      const existingAdminRole = await Role.findOne({ name: "admin" });
      if (existingAdminRole) {
        return res.status(400).json({ message: "Admin role already exists" });
      }
    }

    // Check if the role already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ message: "Role already exists" });
    }

    // Create new role
    const role = new Role({ name });
    await role.save();
    res.status(201).json(role);
  } catch (err) {
    console.error("Error creating role:", err);
    res.status(500).json({ message: "Error creating role" });
  }
});

app.get("/api/roles", authMiddleware, async (req, res) => {
  try {
    if (req.user.isAdminPermanent || req.user.role.name === "admin") {
      const roles = await Role.find();
      res.json(roles);
    } else {
      res.json([req.user.role]); // Only send the user's role
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch roles" });
  }
});

// User Management
app.get("/api/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select("-password").populate("role");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

app.put(
  "/api/users/:userId/role",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { roleId } = req.body;

      // Validate inputs
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const role = await Role.findById(roleId);
      if (!role) return res.status(404).json({ message: "Role not found" });

      // Prevent admin role modification
      if (user.isAdminPermanent) {
        return res
          .status(400)
          .json({ message: "Admin role cannot be modified" });
      }

      // Update user role
      user.role = role._id;
      await user.save();

      // Return updated user
      const updatedUser = await User.findById(userId)
        .select("-password")
        .populate("role");

      res.json(updatedUser);
    } catch (err) {
      res.status(500).json({ message: "Role update failed" });
    }
  }
);
// POST request to assign a role to a user
app.post(
  "/api/users/:userId/role",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { roleId } = req.body;

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const role = await Role.findById(roleId);
      if (!role) return res.status(404).json({ message: "Role not found" });

      // Prevent assigning admin role to non-admin users
      if (role.name === "admin" && user.isAdminPermanent) {
        return res.status(400).json({
          message: "Admin role cannot be assigned to non-admin users",
        });
      }

      user.role = role._id;
      user.isRoleAssigned = true; // Update the user as having a role
      await user.save();

      res.status(200).json({ message: "Role assigned successfully", user });
    } catch (err) {
      res.status(500).json({ message: "Error assigning role" });
    }
  }
);

// Update Role
app.put(
  "/api/roles/:roleId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { roleId } = req.params;
      const { name } = req.body;

      // Fetch the role by ID
      const role = await Role.findById(roleId);
      if (!role) return res.status(404).json({ message: "Role not found" });

      // Check if the role is protected
      if (role.name === "admin") {
        return res
          .status(400)
          .json({ message: "Admin role is protected and cannot be updated" });
      }

      // Allow update for any other role, even if assigned to users
      role.name = name;
      await role.save();

      res.json(role);
    } catch (err) {
      console.error(err); // Log to debug the exact error
      res.status(500).json({ message: "Error updating role" });
    }
  }
);

// Delete Role
app.delete(
  "/api/roles/:roleId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { roleId } = req.params;

      // Find the role by ID
      const role = await Role.findById(roleId);
      if (!role) return res.status(404).json({ message: "Role not found" });

      // Prevent deletion of the 'admin' role
      if (role.name === "admin") {
        return res
          .status(400)
          .json({ message: "Admin role cannot be deleted" });
      }

      // Proceed to delete the role (even if it is assigned to users)
      await Role.findByIdAndDelete(roleId);
      res.json({ message: "Role deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting role" });
    }
  }
);

// Error Handling
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
