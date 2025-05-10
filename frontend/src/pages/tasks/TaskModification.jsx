/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FiCalendar, FiUser, FiClipboard, FiChevronDown } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./TaskModification.css";

const TaskModification = () => {
  const [taskData, setTaskData] = useState({
    name: "",
    description: "",
    expireDate: "",
    assignedTo: ""
  });
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    expireDate: "",
    assignedTo: ""
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/task", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          }
        });
        setTasks(response.data);
      } catch (err) {
        toast.error("Failed to fetch tasks");
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/users", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          }
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
    setErrors({ ...errors, [name]: "" });
  };

  const handleSelectUser = (userId) => {
    setTaskData({ ...taskData, assignedTo: userId });
    setErrors({ ...errors, assignedTo: "" });
    setDropdownOpen(false);
  };

  const handleEditTask = (taskId) => {
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
      setTaskData({
        name: "",
        description: "",
        expireDate: "",
        assignedTo: ""
      });
    } else {
      const taskToEdit = tasks.find((task) => task._id === taskId);
      setSelectedTaskId(taskId);
      setTaskData({
        name: taskToEdit.name,
        description: taskToEdit.description,
        expireDate: taskToEdit.expireDate,
        assignedTo: taskToEdit.assignedTo?._id || ""
      });
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setLoading(true);

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
          : ""
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
            "Content-Type": "application/json"
          }
        }
      );
      toast.success("Task updated successfully!");
      const response = await axios.get("http://localhost:5000/api/task", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });
      setTasks(response.data);
      setSelectedTaskId(null);
      setTaskData({
        name: "",
        description: "",
        expireDate: "",
        assignedTo: ""
      });
    } catch (err) {
      toast.error("Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <div className="task-management-container">
      <h1 className="main-title">Task Management Dashboard</h1>

      <div className="task-cards-container">
        {tasks.map((task) => (
          <div key={task._id} className="task-card">
            <div className="task-card-header">
              <div className="task-meta">
                <h3 className="task-title">{task.name}</h3>
              </div>
              <button
                onClick={() => handleEditTask(task._id)}
                className="task-card-edit-button"
              >
                <FiClipboard className="icon-spacing" />
                {selectedTaskId === task._id ? "Close Edit" : "Edit Task"}
              </button>
            </div>

            <p className="task-description">{task.description}</p>

            <div className="task-footer">
              <div className="user-info">
                <div className="user-avatar">
                  {task.assignedTo?.fullName?.charAt(0) || "U"}
                </div>
                <div>
                  <div className="user-name">
                    {task.assignedTo?.fullName || "Unassigned"}
                  </div>
                  <small className="user-role">
                    {task.assignedTo?.role?.name || "Employee"}
                  </small>
                </div>
              </div>
              <div className="task-due-date">
                <FiCalendar className="icon-spacing" />
                {new Date(task.expireDate).toLocaleDateString()}
              </div>
            </div>

            {selectedTaskId === task._id && (
              <form onSubmit={handleUpdateTask} className="task-edit-form">
                <div className="form-group">
                  <input
                    type="text"
                    name="name"
                    value={taskData.name}
                    onChange={handleInputChange}
                    placeholder="Task Title"
                    className="task-modify-forms"
                  />
                  {errors.name && <div className="error">{errors.name}</div>}
                </div>

                <div className="form-group">
                  <textarea
                    className="task-modify-form"
                    name="description"
                    value={taskData.description}
                    onChange={handleInputChange}
                    placeholder="Task Briefing"
                  />
                  {errors.description && (
                    <div className="error">{errors.description}</div>
                  )}
                </div>

                <div className="form-group">
                  <div className="task-creation-input-group">
                    <FiCalendar className="task-modify-input-icon" />
                    <DatePicker
                      selected={
                        taskData.expireDate
                          ? new Date(taskData.expireDate)
                          : null
                      }
                      onChange={(date) =>
                        setTaskData({ ...taskData, expireDate: date })
                      }
                      dateFormat="dd/MM/yyyy"
                      className="task-modify-date-input"
                      placeholderText="dd/mm/yyyy"
                    />
                    {errors.expireDate && (
                      <span className="error">{errors.expireDate}</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <div className="custom-dropdown">
                    <div
                      className="custom-dropdown-modify-header"
                      onClick={toggleDropdown}
                    >
                      {taskData.assignedTo
                        ? users.find((user) => user._id === taskData.assignedTo)
                            ?.fullName
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

                <button
                  type="submit"
                  disabled={loading}
                  className="task-creation-submit-button"
                >
                  <span>{loading ? "Updating Task..." : "Update Task"}</span>
                  <div className="task-creation-button-glow"></div>
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskModification;
