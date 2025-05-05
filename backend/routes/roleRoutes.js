const express = require("express");
const router = express.Router();
const Role = require("../models/Role");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

router.get("/", authMiddleware, async (req, res) => {
  const roles =
    req.user.isAdminPermanent || req.user.role.name === "admin"
      ? await Role.find()
      : [req.user.role];
  res.json(roles);
});

router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  const { name } = req.body;
  if (await Role.findOne({ name }))
    return res.status(400).json({ message: "Role already exists" });

  const role = new Role({ name });
  await role.save();
  res.status(201).json(role);
});

router.put("/:roleId", authMiddleware, adminMiddleware, async (req, res) => {
  const role = await Role.findById(req.params.roleId);
  if (!role) return res.status(404).json({ message: "Role not found" });
  if (role.name === "admin")
    return res.status(400).json({ message: "Admin role is protected" });

  role.name = req.body.name;
  await role.save();
  res.json(role);
});

router.delete("/:roleId", authMiddleware, adminMiddleware, async (req, res) => {
  const role = await Role.findById(req.params.roleId);
  if (!role) return res.status(404).json({ message: "Role not found" });
  if (role.name === "admin")
    return res.status(400).json({ message: "Admin role cannot be deleted" });

  await Role.findByIdAndDelete(req.params.roleId);
  res.json({ message: "Role deleted successfully" });
});

module.exports = router;
