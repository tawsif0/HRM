/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify"; // Import toast
import "react-toastify/dist/ReactToastify.css"; // Import CSS for toast
import "./AssignTaskCreator.css"; // Custom styling

const AssignTaskCreator = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/users", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });

        // Filter out admin users
        const filteredUsers = res.data.filter(
          (user) => user.role.name !== "admin"
        );
        setUsers(filteredUsers);
      } catch (err) {
        toast.error("Error fetching users"); // Show error toast
      }
    };
    fetchUsers();
  }, []);

  // Handle assigning Task Creator privilege
  const handleAssignRole = async (userId) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `http://localhost:5000/api/users/${userId}/assign-task-creator`,
        {}, // Empty body
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          }
        }
      );

      // Update local state
      setUsers(
        users.map((user) => (user._id === userId ? response.data.user : user))
      );

      toast.success("Task creator role assigned successfully!");
    } catch (err) {
      console.error("Error:", err.response?.data);
      toast.error(
        err.response?.data?.message || "Failed to assign task creator role"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle removing Task Creator privilege
  const handleRemoveRole = async (userId) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `http://localhost:5000/api/users/${userId}/remove-task-creator`,
        {}, // Empty body
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          }
        }
      );

      // Update local state
      setUsers(
        users.map((user) => (user._id === userId ? response.data.user : user))
      );

      toast.success("Task creator removed successfully!");
    } catch (err) {
      console.error("Error:", err.response?.data);
      toast.error(
        err.response?.data?.message || "Failed to remove task creator"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assign-task-creator-container">
      <h2 className="assign-task-creator-title">Assign the Task Creator</h2>

      <div className="assign-task-creator-users">
        {users.map((user) => (
          <div key={user._id} className="task-creator-card">
            <div className="user-info">
              <div className="user-avatar">{user.fullName.charAt(0)}</div>
              <div>
                <div className="user-name">{user.fullName}</div>
                <small>{user.role?.name}</small>
              </div>
            </div>

            <div className="button-group">
              {/* Make Task Creator Button */}
              {!user.isTaskCreator && (
                <button
                  onClick={() => handleAssignRole(user._id)}
                  disabled={loading}
                  className="assign-button"
                >
                  {loading ? "Assigning..." : "Make Task Creator"}
                </button>
              )}

              {/* Remove Task Creator Button */}
              {user.isTaskCreator && (
                <button
                  onClick={() => handleRemoveRole(user._id)}
                  disabled={loading}
                  className="remove-button"
                >
                  {loading ? "Removing..." : "Remove Task Creator"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssignTaskCreator;
