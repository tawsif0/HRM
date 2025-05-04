/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import {
  FiHome,
  FiFileText,
  FiSettings,
  FiUser,
  FiLogOut,
  FiCheckSquare,
  FiChevronDown,
  FiMenu,
  FiX,
  FiBell,
  FiPlus,
  FiUserPlus,
  FiEdit,
  FiTrash2
} from "react-icons/fi";
import { Dropdown } from "react-bootstrap";
import "./Dashboard.css";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [currentView, setCurrentView] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [editingUsers, setEditingUsers] = useState({});
  const [fixedRoles, setFixedRoles] = useState({});
  const [isEditingRole, setIsEditingRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchUserData = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
      } catch (error) {
        console.error("Error fetching user:", error);
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/roles", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRoles(res.data);
      } catch (err) {
        console.error("Error fetching roles:", err);
      }
    };

    fetchRoles();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/users", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const usersData = res.data;
        setUsers(usersData);

        const initialSelected = {};
        const initialFixed = {};
        usersData.forEach((user) => {
          initialSelected[user._id] = user.role?._id || null;
          initialFixed[user._id] = user.role?.name === "admin";
        });
        setSelectedRoles(initialSelected);
        setFixedRoles(initialFixed);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, []);

  const handleLogout = () => {
    toast.info("Logging out...", {
      autoClose: 1500,
      hideProgressBar: true,
      onClose: () => {
        localStorage.removeItem("token");
        navigate("/login");
      }
    });
  };

  const toggleMenu = (menu) => {
    setActiveMenu(activeMenu === menu ? "" : menu);
  };

  const handleCreateRole = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/roles",
        { name: roleName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Role created successfully!");
      setRoleName("");
      setCurrentView(null);
      setRoles([...roles, res.data]);
    } catch (err) {
      toast.error("Error creating role");
    }
  };

  const handleAssignRole = async (userId) => {
    try {
      const selectedRoleId = selectedRoles[userId];
      if (!selectedRoleId) {
        toast.error("Please select a role.");
        return;
      }

      // Prevent assigning admin role to non-admin users
      if (roles.find((role) => role._id === selectedRoleId)?.name === "admin") {
        toast.error("Admin role cannot be assigned to non-admin users.");
        return;
      }

      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/users/${userId}/role`,
        { roleId: selectedRoleId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId
            ? { ...user, role: roles.find((r) => r._id === selectedRoleId) }
            : user
        )
      );

      toast.success("Role assigned successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error assigning role");
    }
  };

  const handleUpdateRole = async (userId) => {
    try {
      const selectedRoleId = selectedRoles[userId];
      if (!selectedRoleId) {
        toast.error("Please select a role.");
        return;
      }

      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/users/${userId}/role`,
        { roleId: selectedRoleId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId
            ? { ...user, role: roles.find((r) => r._id === selectedRoleId) }
            : user
        )
      );
      setEditingUsers((prev) => ({ ...prev, [userId]: false }));

      toast.success("Role updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error updating role");
    }
  };

  const handleEditRole = async (roleId, newRoleName) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `http://localhost:5000/api/roles/${roleId}`,
        { name: newRoleName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Role updated successfully!");

      // Update local state with the new role name
      setRoles((prevRoles) =>
        prevRoles.map((role) =>
          role._id === roleId ? { ...role, name: newRoleName } : role
        )
      );
      setIsEditingRole(null); // Stop editing
    } catch (err) {
      console.error("Error updating role:", err.response?.data?.message);
      toast.error("Error updating role");
    }
  };

  const handleDeleteRole = async (roleId) => {
    const role = roles.find((r) => r._id === roleId);

    // Prevent deletion of the admin role
    if (role && role.name === "admin") {
      toast.error("Admin role cannot be deleted.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remove the deleted role from the roles state
      setRoles((prevRoles) => prevRoles.filter((role) => role._id !== roleId));

      toast.success("Role deleted successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting role");
    }
  };

  const renderRoleAssignment = (user) => {
    const currentRole = user.role;
    const isEditing = editingUsers[user._id];
    const selectedRoleId = selectedRoles[user._id];
    const selectedRole = roles.find((role) => role._id === selectedRoleId);

    if (!currentRole || isEditing) {
      return (
        <div className="role-assignment-container">
          <Dropdown>
            <Dropdown.Toggle className="role-dropdown">
              {selectedRole?.name || currentRole?.name || "Select Role"}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {roles
                .filter((role) => role.name !== "admin") // Exclude admin role
                .map((role) => (
                  <Dropdown.Item
                    key={role._id}
                    onClick={() =>
                      setSelectedRoles((prev) => ({
                        ...prev,
                        [user._id]: role._id
                      }))
                    }
                  >
                    {role.name}
                  </Dropdown.Item>
                ))}
            </Dropdown.Menu>
          </Dropdown>
          <button
            className={`action-button ${currentRole ? "update" : "assign"}`}
            onClick={() =>
              currentRole
                ? handleUpdateRole(user._id)
                : handleAssignRole(user._id)
            }
          >
            <FiCheckSquare /> {currentRole ? "Update" : "Assign"}
          </button>
        </div>
      );
    }

    return (
      <div className="role-display-container">
        <span className="assigned-role">{currentRole.name}</span>
        {!fixedRoles[user._id] && (
          <button
            className="edit-button"
            onClick={() => {
              setSelectedRoles((prev) => ({
                ...prev,
                [user._id]: currentRole._id
              }));
              setEditingUsers((prev) => ({ ...prev, [user._id]: true }));
            }}
          >
            <FiEdit />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <aside
        className={`dashboard-sidebar ${
          isCollapsed ? "dashboard-collapsed" : ""
        }`}
      >
        <div className="dashboard-sidebar-header">
          <h2 className="dashboard-brand-text">
            {!isCollapsed && "Panel"}
            <button
              className="dashboard-menu-toggle"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <FiMenu /> : <FiX />}
            </button>
          </h2>
        </div>

        <nav className="dashboard-sidebar-nav">
          <div className="dashboard-nav-item">
            <FiHome className="dashboard-nav-icon" />
            {!isCollapsed && <span>Dashboard</span>}
          </div>
          <div className="divider"></div>

          <div className="dashboard-nav-section">
            <div
              className="dashboard-nav-header"
              onClick={() => toggleMenu("pages")}
            >
              <FiFileText className="dashboard-nav-icon" />
              {!isCollapsed && (
                <>
                  <span>Pages</span>
                  <FiChevronDown
                    className={`dashboard-arrow ${
                      activeMenu === "pages" ? "open" : ""
                    }`}
                  />
                </>
              )}
            </div>

            {!isCollapsed && activeMenu === "pages" && (
              <div className="dashboard-sub-menu">
                {user?.role?.name === "admin" && (
                  <>
                    <div className="dashboard-sub-item">
                      <FiCheckSquare className="dashboard-check-icon" />
                      <span>Roles</span>
                    </div>
                    <div className="divider"></div>
                    <div className="dashboard-bullet-items">
                      <div
                        className="dashboard-bullet-item"
                        onClick={() => setCurrentView("create")}
                      >
                        <span className="dashboard-bullet">•</span>
                        <span className="dashboard-contents">Create</span>
                      </div>
                      <div
                        className="dashboard-bullet-item"
                        onClick={() => setCurrentView("assign")}
                      >
                        <span className="dashboard-bullet">•</span>
                        <span className="dashboard-contents">Assign</span>
                      </div>
                      <div
                        className="dashboard-bullet-item"
                        onClick={() => setCurrentView("modify")}
                      >
                        <span className="dashboard-bullet">•</span>
                        <span className="dashboard-contents">Modify</span>
                      </div>
                    </div>
                    <div className="divider"></div>
                  </>
                )}
                {user?.role?.name === "admin" && (
                  <div
                    className="dashboard-bullet-item"
                    onClick={() => setCurrentView("see")}
                  >
                    <span className="dashboard-bullet">•</span>
                    <span className="dashboard-contents">See Role</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      </aside>

      <main
        className={`dashboard-main ${isCollapsed ? "dashboard-collapsed" : ""}`}
      >
        <div className="dashboard-top-nav">
          <div className="dashboard-user-greeting">
            <h3>{user?.fullName || "User"}'s Dashboard</h3>
            {/* Display the user role */}
            <div className="user-role-display">
              <span>
                <strong>Role:</strong> {user?.role?.name || "No role assigned"}
              </span>
            </div>
          </div>

          <div className="dashboard-top-nav-right">
            <FiBell size={24} className="dashboard-notification-icon" />
            <Dropdown show={showSettings} onToggle={setShowSettings}>
              <Dropdown.Toggle
                variant="link"
                className="dashboard-settings-toggle"
              >
                <FiSettings size={24} />
              </Dropdown.Toggle>

              <Dropdown.Menu align="end" className="dashboard-settings-menu">
                <Dropdown.Item className="dashboard-settings-item">
                  <FiUser className="me-2" />
                  Account Settings
                </Dropdown.Item>
                <Dropdown.Item
                  className="dashboard-settings-item"
                  onClick={handleLogout}
                >
                  <FiLogOut className="me-2" />
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        <div className="dashboard-content-area">
          {/* Role Creation, Assigning, Modify, and View */}
          {currentView === "create" && (
            <div className="form-container create-role-form">
              <div className="form-header">
                <FiPlus className="form-icon" />
                <h3>Create New Role</h3>
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Enter role name (e.g., Employee)"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="modern-input"
                />
                <button onClick={handleCreateRole} className="gradient-button">
                  <FiPlus /> Create Role
                </button>
              </div>
            </div>
          )}

          {currentView === "assign" && (
            <div className="form-container assign-role-form">
              <div className="form-header">
                <FiUserPlus className="form-icon" />
                <h3>Assign Roles to Users</h3>
              </div>
              <div className="user-list">
                {users.map((user) => (
                  <div className="user-card" key={user._id}>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.fullName.charAt(0)}
                      </div>
                      <span className="user-name">{user.fullName}</span>
                    </div>
                    <div className="role-assignment">
                      {renderRoleAssignment(user)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentView === "modify" && (
            <div className="role-management-section">
              <h3>Modify Roles</h3>
              <div className="roles-list">
                {roles
                  .filter((role) => role.name !== "admin") // Exclude admin role
                  .map((role) => (
                    <div className="role-item" key={role._id}>
                      {isEditingRole === role._id ? (
                        <div className="role-edit-form">
                          <input
                            type="text"
                            value={role.name}
                            onChange={(e) => {
                              setRoles((prevRoles) =>
                                prevRoles.map((r) =>
                                  r._id === role._id
                                    ? { ...r, name: e.target.value }
                                    : r
                                )
                              );
                            }}
                          />
                          <div className="role-actions">
                            <button
                              className="save-button"
                              onClick={() =>
                                handleEditRole(role._id, role.name)
                              }
                            >
                              Save
                            </button>
                            <button
                              className="cancel-button"
                              onClick={() => setIsEditingRole(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="role-display-container">
                          <span className="role-name">{role.name}</span>
                          <div className="role-actions">
                            <button
                              className="edit-button"
                              onClick={() => setIsEditingRole(role._id)}
                            >
                              <FiEdit />
                            </button>
                            <button
                              className="delete-button"
                              onClick={() => handleDeleteRole(role._id)}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {currentView === "see" && user?.role?.name === "admin" && (
            <div className="form-container see-role-form">
              <h3>View User Roles</h3>
              <div className="user-list">
                {users.map((user) => (
                  <div className="user-card" key={user._id}>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.fullName.charAt(0)}
                      </div>
                      <span className="user-name">{user.fullName}</span>
                    </div>
                    <div className="role-assignment">
                      <span className="assigned-role">
                        {user.role?.name || "No Role Assigned"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
