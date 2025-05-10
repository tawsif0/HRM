/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FiCalendar, FiUser, FiClipboard, FiChevronDown } from "react-icons/fi";
import DatePicker from "react-datepicker"; // Import react-datepicker
import "react-datepicker/dist/react-datepicker.css"; // Import the CSS for react-datepicker
import "./TaskModification.css"; // Make sure to link your CSS

const TaskModification = () => {
  const [taskData, setTaskData] = useState({
    name: "",
    description: "",
    expireDate: "",
    assignedTo: "",
  });
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    expireDate: "",
    assignedTo: "",
  });
  const [dropdownOpen, setDropdownOpen] = useState(false); // Dropdown state
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Fetch tasks and users on component mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/tasks", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });

        setTasks(response.data);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        toast.error("Failed to fetch tasks");
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/users", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        const filteredUsers = response.data.filter(
          (user) => user.role.name !== "admin" && !user.isTaskCreator
        );
        setUsers(filteredUsers);
      } catch (err) {
        toast.error("Failed to fetch users");
      }
    };

    fetchTasks();
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskData({ ...taskData, [name]: value });

    // Clear error when the user starts typing again
    setErrors({ ...errors, [name]: "" });
  };

  const handleSelectUser = (userId) => {
    setTaskData({ ...taskData, assignedTo: userId });
    setErrors({ ...errors, assignedTo: "" }); // Clear error for assignedTo
    setDropdownOpen(false); // Close dropdown after selection
  };

  const handleEditTask = (taskId) => {
    const taskToEdit = tasks.find((task) => task._id === taskId);
    setSelectedTaskId(taskId);
    setTaskData({
      name: taskToEdit.name,
      description: taskToEdit.description,
      expireDate: taskToEdit.expireDate,
      assignedTo: taskToEdit.assignedTo?._id || "",
    });
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate the form
    if (
      !taskData.name ||
      !taskData.description ||
      !taskData.expireDate ||
      !taskData.assignedTo
    ) {
      setErrors({
        ...errors,
        name: !taskData.name ? "Task title is required" : "",
        description: !taskData.description ? "Task briefing is required" : "",
        expireDate: !taskData.expireDate ? "Expiration date is required" : "",
        assignedTo: !taskData.assignedTo
          ? "Please select a user for the task"
          : "",
      });
      setLoading(false);
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/tasks/modify/${selectedTaskId}`,
        taskData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Task updated successfully!");
      setSelectedTaskId(null); // Close the edit form
      setTaskData({
        name: "",
        description: "",
        expireDate: "",
        assignedTo: "",
      });
      // Refetch tasks after update
      const response = await axios.get("http://localhost:5000/api/tasks", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      setTasks(response.data);
    } catch (err) {
      toast.error("Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  // Toggle the dropdown visibility
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <div className="task-management-container">
      <h1>Task Management</h1>

      {/* Task Cards */}
      <div className="task-cards-container">
        {tasks.map((task) => (
          <div key={task._id} className="task-card">
            <div className="task-card-header">
              <h3>{task.name}</h3>
              <span>{task.assignedTo?.fullName || "Unassigned"}</span>
            </div>
            <p>{task.description}</p>
            <button
              onClick={() => handleEditTask(task._id)}
              className="task-card-edit-button"
            >
              <FiClipboard /> Edit
            </button>
          </div>
        ))}
      </div>

      {/* Task Edit Form */}
      {selectedTaskId && (
        <form onSubmit={handleUpdateTask} className="task-edit-form">
          <h2>Edit Task</h2>
          <input
            type="text"
            name="name"
            value={taskData.name}
            onChange={handleInputChange}
            placeholder="Task Title"
          />
          {errors.name && <div className="error">{errors.name}</div>}

          <textarea
            name="description"
            value={taskData.description}
            onChange={handleInputChange}
            placeholder="Task Briefing"
          />
          {errors.description && (
            <div className="error">{errors.description}</div>
          )}

          <DatePicker
            selected={
              taskData.expireDate ? new Date(taskData.expireDate) : null
            }
            onChange={(date) => setTaskData({ ...taskData, expireDate: date })}
            dateFormat="dd/MM/yyyy"
            className="task-creation-date-input"
            placeholderText="dd/mm/yyyy"
          />
          {errors.expireDate && (
            <div className="error">{errors.expireDate}</div>
          )}

          {/* Custom Dropdown for selecting a user */}
          <div className="custom-dropdown">
            <div className="custom-dropdown-header" onClick={toggleDropdown}>
              {taskData.assignedTo
                ? users.find((user) => user._id === taskData.assignedTo)
                    .fullName
                : "Select User For the Task"}
              <FiChevronDown className="dropdown-arrow" />
            </div>

            {dropdownOpen && (
              <div className="custom-dropdown-list">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="custom-dropdown-item"
                    onClick={() => handleSelectUser(user._id)}
                  >
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="user-name">{user.fullName}</div>
                        <small>{user.role?.name || "Employee"}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {errors.assignedTo && (
            <div className="error">{errors.assignedTo}</div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Task"}
          </button>
        </form>
      )}
    </div>
  );
};

export default TaskModification;
