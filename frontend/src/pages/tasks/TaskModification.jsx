/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FiCalendar,
  FiClipboard,
  FiChevronDown,
  FiTrash2,
  FiUpload,
  FiCloud,
  FiX,
} from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./TaskModification.css";
import imageCompression from "browser-image-compression";

const TaskModification = () => {
  const [taskData, setTaskData] = useState({
    name: "",
    description: "",
    expireDate: "",
    assignedTo: "",
    file: null, // Store file here
  });
  const [selectedFileName, setSelectedFileName] = useState("");
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    expireDate: "",
    assignedTo: "",
    file: "",
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // To control modal visibility
  const [gitData, setGitData] = useState({
    gitUrl: "",
    gitDescription: "",
  });
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/task", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
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
    setErrors({ ...errors, [name]: "" });
  };

  const handleSelectUser = (userId) => {
    setTaskData({ ...taskData, assignedTo: userId });
    setErrors({ ...errors, assignedTo: "" });
    setDropdownOpen(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];

    if (file) {
      const fileType = file.type;
      const fileName = file.name.toLowerCase();

      // Allowed file types (image, PDF, and zip)
      const allowedFileTypes = [
        "image/png",
        "image/jpg",
        "image/jpeg",
        "image/webp",
        "application/pdf",
        "application/zip", // Added for zip files
      ];

      // Check if the file type is allowed by MIME type or by extension for zip files
      const isZipFile = fileName.endsWith(".zip");

      if (!allowedFileTypes.includes(fileType) && !isZipFile) {
        toast.error("Please upload PNG, JPG, WebP, PDF, or ZIP files only.");
        setErrors({
          ...errors,
          file: "Invalid file type. Please upload a valid file.",
        });
        setTaskData({ ...taskData, file: null });
        setSelectedFileName(""); // Clear the file name
        return;
      }

      // Proceed with the file processing (compression for images)
      if (file.size > 5 * 1024 * 1024) {
        // File size exceeds 5MB
        if (fileType.includes("image")) {
          try {
            const options = {
              maxSizeMB: 4, // Compress to below 5MB
              maxWidthOrHeight: 1024, // Resize dimensions for images
              useWebWorker: true, // Use web workers to handle compression
            };
            const compressedFile = await imageCompression(file, options);

            // Now convert the compressed file to PNG format
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();
            img.src = URL.createObjectURL(compressedFile);

            img.onload = () => {
              // Set canvas dimensions to the image's dimensions
              canvas.width = img.width;
              canvas.height = img.height;

              // Draw the image on the canvas
              ctx.drawImage(img, 0, 0);

              // Convert the canvas image to PNG
              canvas.toBlob((blob) => {
                const pngFile = new File([blob], "compressed_image.png", {
                  type: "image/png",
                });

                toast.success("Image compressed and saved as PNG");
                setErrors({ ...errors, file: "" });
                setTaskData({ ...taskData, file: pngFile });
                setSelectedFileName(pngFile.name);
              }, "image/png");
            };
          } catch (err) {
            toast.error("Error during image compression");
          }
        } else {
          toast.error("File size exceeds 5MB. Please upload a smaller file.");
          setErrors({ ...errors, file: "File size cannot exceed 5MB" });
          setTaskData({ ...taskData, file: null });
        }
      } else {
        setErrors({ ...errors, file: "" });
        setTaskData({ ...taskData, file });
        setSelectedFileName(file.name);
      }
    }
  };

  const handleFileRemove = () => {
    setTaskData({ ...taskData, file: null });
    setSelectedFileName(""); // Clear the displayed file name
  };

  const handleEditTask = (taskId) => {
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
      setTaskData({
        name: "",
        description: "",
        expireDate: "",
        assignedTo: "",
        file: null,
      });
    } else {
      const taskToEdit = tasks.find((task) => task._id === taskId);
      setSelectedTaskId(taskId);
      setTaskData({
        name: taskToEdit.name,
        description: taskToEdit.description,
        expireDate: taskToEdit.expireDate,
        assignedTo: taskToEdit.assignedTo?._id || "",
        file: taskToEdit.file ? taskToEdit.file.split("\\").pop() : null,
      });
      setSelectedFileName(taskToEdit.file.split("\\").pop());
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
          : "",
      });
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", taskData.name);
    formData.append("description", taskData.description);
    formData.append("expireDate", taskData.expireDate);
    formData.append("assignedTo", taskData.assignedTo);

    if (taskData.file) {
      formData.append("file", taskData.file);
    }

    try {
      await axios.put(
        `http://localhost:5000/api/tasks/modify/${selectedTaskId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Task updated successfully!");
      const response = await axios.get("http://localhost:5000/api/task", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      setTasks(response.data);
      setSelectedTaskId(null);
      setTaskData({
        name: "",
        description: "",
        expireDate: "",
        assignedTo: "",
        file: null,
      });
    } catch (err) {
      toast.error("Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      toast.success("Task deleted successfully!");
      setTasks(tasks.filter((task) => task._id !== taskId));
    } catch (err) {
      toast.error("Failed to delete task");
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  const handleProgressClick = async (taskId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/tasks/half-completed/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data) {
        setGitData({
          gitUrl: response.data.gitUrl || "",
          gitDescription: response.data.gitDescription || "",
        });
      } else {
        setGitData({
          gitUrl: "",
          gitDescription: "",
        });
      }
      setIsModalOpen(true);
    } catch (err) {
      toast.error("Failed to fetch progress data");
    }
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
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
              <div className="task-card-buttons">
                <button
                  className="quantum-button gradient-cyan"
                  onClick={() => handleProgressClick(task._id)}
                >
                  Progress
                </button>
                {isModalOpen && (
                  <div className="modal-overlay">
                    <div className="absent-modal">
                      <div className="modal-header">
                        <h2>Progress Details</h2>
                        <FiX onClick={closeModal} className="close-icon" />
                      </div>
                      <div className="modal-body">
                        {gitData.gitUrl && gitData.gitDescription ? (
                          <>
                            <p>
                              <strong>Git URL:</strong>{" "}
                              <a
                                href={gitData.gitUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {gitData.gitUrl}
                              </a>
                            </p>
                            <p>
                              <strong>Git Description:</strong>{" "}
                              {gitData.gitDescription}
                            </p>
                          </>
                        ) : (
                          <p>No progress information available.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {task.isCompleted ? (
                  // If the task is completed, show the "Completed" span
                  <span className="victory-badge">Completed</span>
                ) : (
                  // If the task is not completed, show the "Edit Task" button
                  <button
                    onClick={() => handleEditTask(task._id)}
                    className="task-card-edit-button"
                  >
                    <FiClipboard className="icon-spacing" />
                    {selectedTaskId === task._id ? "Close Edit" : "Edit Task"}
                  </button>
                )}
                <button
                  onClick={() => handleDeleteTask(task._id)}
                  className="task-card-delete-button"
                >
                  <FiTrash2 className="icon-spacing" />
                </button>
              </div>
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
                    {task.assignedTo?.role?.name || "No Role Assigned"}
                  </small>
                </div>
              </div>
              <div className="task-due-date">
                <FiCalendar className="icon-spacing" />
                {new Date(task.expireDate).toLocaleDateString("en-GB")}
              </div>
            </div>

            {selectedTaskId === task._id && (
              <form onSubmit={handleUpdateTask} className="task-edit-form">
                <div className="form-groups">
                  <input
                    type="text"
                    name="name"
                    value={taskData.name}
                    onChange={handleInputChange}
                    placeholder="Task Title"
                    className="task-modify-forms"
                  />
                  {errors.name && <div className="errors">{errors.name}</div>}
                </div>

                <div className="form-groups">
                  <textarea
                    className="task-modify-form"
                    name="description"
                    value={taskData.description}
                    onChange={handleInputChange}
                    placeholder="Task Briefing"
                  />
                  {errors.description && (
                    <div className="errors">{errors.description}</div>
                  )}
                </div>

                <div className="form-groups">
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
                      <span className="errors">{errors.expireDate}</span>
                    )}
                  </div>
                </div>

                <div className="form-groups">
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
                    <span className="errors">{errors.assignedTo}</span>
                  )}
                </div>

                <div className="form-groupss">
                  <div
                    className="task-file-labels"
                    onClick={() => document.getElementById("file").click()}
                  >
                    {selectedFileName ? (
                      <div className="file-name-container">
                        <FiCloud className="upload-icon" />
                        <span className="file-name-text">
                          {selectedFileName}
                        </span>
                        <button
                          type="button"
                          className="task-icon-remove"
                          onClick={handleFileRemove}
                          aria-label="Remove file"
                        >
                          <FiTrash2 className="trash-icon" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="file"
                          name="file"
                          id="file"
                          onChange={handleFileChange}
                          className="task-file-input"
                          style={{ display: "none" }} // Hide the default file input
                        />
                        {/* Label will trigger file input when clicked */}
                        <label htmlFor="file" className="file-label">
                          <FiUpload className="upload-icon" />
                          {taskData.file ? taskData.file.name : "Choose File"}
                        </label>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="task-creation-submit-button"
                >
                  <span>{loading ? "Updating Task..." : "Update Task"}</span>
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
