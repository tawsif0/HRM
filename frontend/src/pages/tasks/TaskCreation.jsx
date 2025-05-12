/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FiUpload, FiChevronDown, FiCalendar } from "react-icons/fi"; // Import necessary icons
import DatePicker from "react-datepicker"; // Import react-datepicker
import "react-datepicker/dist/react-datepicker.css"; // Import the CSS for react-datepicker
import imageCompression from "browser-image-compression"; // Image compression library

import "./TaskCreation.css"; // Make sure to link your CSS

const TaskCreation = () => {
  const [taskData, setTaskData] = useState({
    name: "",
    description: "",
    expireDate: "",
    assignedTo: "",
    file: null, // Store file here
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    expireDate: "",
    assignedTo: "",
    file: "",
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
    const formattedDate = `${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()}`;
    setTaskData({ ...taskData, expireDate: formattedDate });

    setErrors({ ...errors, expireDate: "" });
  };

  const handleSelectUser = (userId) => {
    setTaskData({ ...taskData, assignedTo: userId });
    setDropdownOpen(false);
    setErrors({ ...errors, assignedTo: "" });
  };

  // Handle file change and validate size (5MB limit), compress images, and allow ZIPs
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
      }
    }
  };

  const validateForm = () => {
    let isValid = true;
    let validationErrors = { ...errors };

    if (!taskData.name) {
      validationErrors.name = "Task title is required";
      isValid = false;
    }

    if (!taskData.description) {
      validationErrors.description = "Task briefing is required";
      isValid = false;
    }

    if (!taskData.expireDate) {
      validationErrors.expireDate = "Expiration date is required";
      isValid = false;
    }

    if (!taskData.assignedTo) {
      validationErrors.assignedTo = "Please select a user for the task";
      isValid = false;
    }

    if (!taskData.file) {
      validationErrors.file = "Please upload a file (zip, image, video, etc.)";
      isValid = false;
    }

    setErrors(validationErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", taskData.name);
    formData.append("description", taskData.description);
    formData.append("expireDate", taskData.expireDate);
    formData.append("assignedTo", taskData.assignedTo);
    formData.append("file", taskData.file);

    try {
      await axios.post("http://localhost:5000/api/tasks", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data", // This header is needed for file uploads
        },
      });
      toast.success("Task created successfully!");

      setTaskData({
        name: "",
        description: "",
        expireDate: "",
        assignedTo: "",
        file: null,
      });
    } catch (err) {
      console.error("Error creating task:", err);
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

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

          <div className="task-creation-input-group">
            <input
              type="file"
              name="file"
              id="file"
              onChange={handleFileChange}
              className="task-file-input"
            />
            {/* Show file name or "Choose File" */}
            <label htmlFor="file" className="task-file-label">
              <FiUpload className="upload-icon" />
              {taskData.file ? taskData.file.name : "Choose File"}
            </label>

            {/* Show error if file exceeds 5MB */}
            {errors.file && <span className="error">{errors.file}</span>}
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
