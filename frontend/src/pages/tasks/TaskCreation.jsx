/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FiCalendar, FiUser, FiClipboard, FiChevronDown } from "react-icons/fi";
import DatePicker from "react-datepicker"; // Import react-datepicker
import "react-datepicker/dist/react-datepicker.css"; // Import the CSS for react-datepicker

import "./TaskCreation.css"; // Make sure to link your CSS

const TaskCreation = () => {
  const [taskData, setTaskData] = useState({
    name: "",
    description: "",
    expireDate: "",
    assignedTo: "",
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    expireDate: "",
    assignedTo: "",
  });
  const [dropdownOpen, setDropdownOpen] = useState(false); // Dropdown state

  // Fetch users who are neither admin nor task creator
  useEffect(() => {
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
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskData({ ...taskData, [name]: value });

    // Clear error when the user starts typing again
    setErrors({ ...errors, [name]: "" });
  };

  const handleDateChange = (date) => {
    // Format the date as dd/mm/yyyy
    const formattedDate = `${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()}`;
    setTaskData({ ...taskData, expireDate: formattedDate });

    // Clear the error when the date is changed
    setErrors({ ...errors, expireDate: "" });
  };

  const handleSelectUser = (userId) => {
    setTaskData({ ...taskData, assignedTo: userId });
    setDropdownOpen(false); // Close dropdown after selection

    // Clear error for assignedTo when user selects a user
    setErrors({ ...errors, assignedTo: "" });
  };

  const validateForm = () => {
    let isValid = true;
    let validationErrors = { ...errors };

    // Check if name is empty
    if (!taskData.name) {
      validationErrors.name = "Task title is required";
      isValid = false;
    }

    // Check if description is empty
    if (!taskData.description) {
      validationErrors.description = "Task briefing is required";
      isValid = false;
    }

    // Check if expire date is selected
    if (!taskData.expireDate) {
      validationErrors.expireDate = "Expiration date is required";
      isValid = false;
    }

    // Check if assignedTo is selected
    if (!taskData.assignedTo) {
      validationErrors.assignedTo = "Please select a user for the task";
      isValid = false;
    }

    setErrors(validationErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate the form before submitting
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/tasks", taskData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      toast.success("Task created successfully!");

      // Clear form fields on success
      setTaskData({
        name: "",
        description: "",
        expireDate: "",
        assignedTo: "",
      });
    } catch (err) {
      console.error("Error creating task:", err);
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  // Toggle the dropdown visibility
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <div className="task-creation-container">
      <div className="task-creation-glass-card">
        <header className="task-creation-header">
          <h1>Create New Task 🚀</h1>
          <div className="task-creation-header-accent"></div>
        </header>

        <form onSubmit={handleSubmit} className="task-creation-form">
          <div className="task-creation-input-group">
            <input
              type="text"
              name="name"
              value={taskData.name}
              onChange={handleInputChange}
              placeholder="Task Title"
              className="task-inputs"
            />
            {errors.name && <span className="error">{errors.name}</span>}
          </div>

          <div className="task-creation-input-group">
            <textarea
              name="description"
              value={taskData.description}
              onChange={handleInputChange}
              placeholder="Task Briefing"
              className="task-inputs"
            ></textarea>
            {errors.description && (
              <span className="error">{errors.description}</span>
            )}
          </div>

          <div className="task-wrapper">
            <div className="task-creation-input-group">
              <FiCalendar className="task-creation-input-icon" />

              {/* Use DatePicker from react-datepicker */}
              <DatePicker
                selected={
                  taskData.expireDate
                    ? new Date(
                        taskData.expireDate.split("/").reverse().join("-")
                      )
                    : null
                }
                onChange={handleDateChange}
                dateFormat="dd/MM/yyyy"
                className="task-creation-date-input"
                placeholderText="dd/mm/yyyy"
              />
              {errors.expireDate && (
                <span className="error">{errors.expireDate}</span>
              )}
            </div>

            <div className="task-creation-input-group">
              {/* Custom Dropdown for selecting a user */}
              <div className="custom-dropdown">
                <div
                  className="custom-dropdown-header"
                  onClick={toggleDropdown}
                >
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
                <span className="error">{errors.assignedTo}</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="task-creation-submit-button"
          >
            <span>{loading ? "Launching Task..." : "Create Task"}</span>
            <div className="task-creation-button-glow"></div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskCreation;
