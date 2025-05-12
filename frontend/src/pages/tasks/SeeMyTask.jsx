/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FiChevronDown,
  FiCheckCircle,
  FiClock,
  FiGitBranch,
  FiZap,
  FiXCircle,
  FiSend,
  FiCalendar,
  FiUser
} from "react-icons/fi";
import "./SeeMyTask.css";

const SeeMyTask = () => {
  const [tasks, setTasks] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [expandedTask, setExpandedTask] = useState(null); // Track expanded task
  const [loading, setLoading] = useState(false);

  const [completionDetails, setCompletionDetails] = useState({
    gitUrl: "", // Initialize with an empty string
    gitDescription: "" // Initialize with an empty string
  });

  const [showInputFields, setShowInputFields] = useState(null); // Track if input fields are shown for a specific task
  const [taskIdForHalfCompletion, setTaskIdForHalfCompletion] = useState(null); // Store taskId for half completion

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No token found, please log in again.");
        return;
      }

      try {
        const response = await axios.get(
          "http://localhost:5000/api/user/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        if (response.data) {
          const userId = response.data._id;
          setCurrentUserId(userId);
          fetchUserTasks(userId);
        } else {
          toast.error("User profile not found.");
        }
      } catch (err) {
        toast.error("Failed to fetch user profile");
        console.error("Error fetching profile:", err);
      }
    };

    const fetchUserTasks = async (userId) => {
      if (userId) {
        try {
          const response = await axios.get(
            `http://localhost:5000/api/tasks/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
              }
            }
          );
          setTasks(response.data);
        } catch (err) {
          toast.error("Failed to fetch tasks");
          console.error("Error fetching tasks:", err);
        }
      }
    };

    fetchUserProfile();
    setLoading(true);
  }, []);

  const toggleTaskDetails = (taskId) => {
    setExpandedTask((prev) => (prev === taskId ? null : taskId));
  };

  const handleHalfCompletion = async (taskId, gitUrl, gitDescription) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/tasks/half-complete/${taskId}`,
        {
          completionLink: gitUrl,
          completionDescription: gitDescription
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      // Handle success
      toast.success("Task marked as half-complete");

      // Update the task in the state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId
            ? { ...task, isHalfCompleted: true, gitUrl, gitDescription }
            : task
        )
      );

      // Hide input fields and show the Initial Progress button again
      setShowInputFields(null);
    } catch (err) {
      console.error(err);
      toast.error("Error marking task as half-complete");
    }
  };
  const showHalfCompletionInputs = (taskId) => {
    setShowInputFields(taskId); // Show input fields for the clicked task only
    setTaskIdForHalfCompletion(taskId); // Set the task ID for half completion
  };

  // Input Change Handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCompletionDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value
    }));
  };

  const handleCancel = () => {
    setShowInputFields(null); // Reset the task inputs state
    setTaskIdForHalfCompletion(null); // Reset the task ID for half completion
  };
  const handleDownload = (taskId) => {
    console.log("Task ID:", taskId); // Log the taskId to ensure it's correct

    const token = localStorage.getItem("token"); // Retrieve the token from localStorage
    if (!token) {
      console.error("No token found. Please log in first.");
      return;
    }

    // Call the backend API to download the file
    axios
      .get(`http://localhost:5000/api/task/download/${taskId}`, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then((response) => {
        // Extract the file name from the response headers (content-disposition)
        const contentDisposition = response.headers["content-disposition"];
        let fileName = "downloadedFile"; // Default file name in case we can't extract one

        if (
          contentDisposition &&
          contentDisposition.indexOf("attachment") !== -1
        ) {
          const matches = /filename="([^;]+)"/.exec(contentDisposition);
          if (matches != null && matches[1]) {
            fileName = matches[1];
          }
        }

        // Create a URL for the file and trigger the download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName); // Use the dynamic file name with extension
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((err) => {
        console.error("Error downloading file:", err);
      });
  };

  const handleCompletion = async (taskId) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/tasks/complete/${taskId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      toast.success("Task completed");

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId
            ? { ...task, isCompleted: true, isHalfCompleted: false }
            : task
        )
      );
    } catch (err) {
      toast.error("Error completing task");
    }
  };
  return (
    <div className="task-container">
      <div className="glass-header">
        <h1 className="holographic-title">Task Master</h1>
        <div className="neu-stats">
          <div className="neu-stat-card">
            <FiClock className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">
                {tasks.filter((t) => !t.isCompleted).length}
              </span>
              <span className="stat-label">Active Missions</span>
            </div>
          </div>
          <div className="neu-stat-card gradient-teal">
            <FiCheckCircle className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">
                {tasks.filter((t) => t.isCompleted).length}
              </span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
        </div>
      </div>

      <div className="quantum-task-board">
        {/* Pending Tasks */}
        <div className="task-dimension">
          <div className="dimension-header neon-blue">
            <FiZap className="dimension-icon" />
            <h2>Active Operations</h2>
            <div className="particle-effect"></div>
          </div>

          <div className="task-orbit">
            {tasks
              .filter((task) => !task.isCompleted)
              .map((task) => (
                <div
                  key={task._id}
                  className={`stellar-card ${
                    new Date() > new Date(task.expireDate) ? "supernova" : ""
                  }`}
                >
                  <div
                    className="card-event-horizon"
                    onClick={() => toggleTaskDetails(task._id)}
                  >
                    <div className="stellar-header">
                      <h3 className="task-title">{task.name}</h3>
                      <FiChevronDown
                        className={`wormhole-icon ${
                          expandedTask === task._id ? "rotated" : ""
                        }`}
                      />
                    </div>
                    <div className="cosmic-meta">
                      <span className="meta-star">
                        <FiCalendar className="meta-pulsar" />
                        {new Date(task.expireDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                      <span className="meta-star">
                        <FiUser className="meta-pulsar" />
                        {task.createdBy?.fullName || "Unknown"}
                      </span>
                    </div>
                  </div>

                  {expandedTask === task._id && (
                    <div className="blackhole-details">
                      <div className="nebula-description">
                        <p>{task.description}</p>
                      </div>

                      <div className="temporal-indicator">
                        <div className="time-vortex">
                          <FiClock className="chrono-icon" />
                          <span className="time-flux">
                            {new Date() > new Date(task.expireDate)
                              ? `${Math.floor(
                                  (new Date() - new Date(task.expireDate)) /
                                    (1000 * 60 * 60 * 24)
                                )} Days overdue`
                              : `${Math.floor(
                                  (new Date(task.expireDate) - new Date()) /
                                    (1000 * 60 * 60 * 24)
                                )}Days remaining`}
                          </span>
                        </div>
                      </div>

                      {/* Initial Progress Button */}
                      {showInputFields === null && (
                        <div className="quantum-actions">
                          <button
                            className="quantum-button gradient-blue"
                            onClick={() => showHalfCompletionInputs(task._id)}
                          >
                            <FiGitBranch className="quantum-icon" />
                            <span>Initial Progress</span>
                            <div className="quantum-glow"></div>
                          </button>
                        </div>
                      )}

                      {/* Input Fields and Save/Cancel Buttons */}
                      {showInputFields === task._id && (
                        <div className="modern-inputs">
                          <input
                            type="text"
                            name="gitUrl"
                            value={completionDetails.gitUrl} // Controlled input
                            onChange={handleInputChange}
                            placeholder="Git URL"
                            className="modern-input"
                          />
                          <textarea
                            name="gitDescription"
                            value={completionDetails.gitDescription} // Controlled input
                            onChange={handleInputChange}
                            placeholder="Git Commit Description"
                            className="modern-input"
                          />
                          <div className="quantum-actions">
                            <button
                              onClick={() =>
                                handleHalfCompletion(
                                  task._id,
                                  completionDetails.gitUrl,
                                  completionDetails.gitDescription
                                )
                              }
                              className="quantum-button gradient-green"
                            >
                              Save
                            </button>
                            <button
                              className="quantum-button gradient-red"
                              onClick={handleCancel}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Download Button (unchanged) */}
                      <div className="quantum-actions">
                        <button
                          className="quantum-button gradient-white"
                          onClick={() => handleDownload(task._id)}
                        >
                          Download
                        </button>

                        <button
                          className={`quantum-button ${
                            new Date() > new Date(task.expireDate)
                              ? "gradient-red"
                              : "gradient-purple"
                          } completion-singularity`}
                          onClick={() => handleCompletion(task._id)}
                          disabled={task.isCompleted}
                        >
                          <FiCheckCircle className="quantum-icon" />
                          <span>
                            {new Date() > new Date(task.expireDate)
                              ? "Initiate Overdue Protocol"
                              : "Activate Completion"}
                          </span>
                          <div className="quantum-glow"></div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="task-dimension">
          <div className="dimension-header neon-green">
            <FiCheckCircle className="dimension-icon" />
            <h2>Archived Triumphs</h2>
            <div className="particle-effect"></div>
          </div>

          <div className="task-orbit">
            {tasks
              .filter((task) => task.isCompleted)
              .map((task) => (
                <div key={task._id} className="stellar-card achievement">
                  <div className="stellar-header">
                    <h3 className="task-title">{task.name}</h3>
                    <div className="victory-badge">
                      <FiCheckCircle className="badge-core" />
                      <div className="badge-aurora"></div>
                      <span>
                        {task.isExpired
                          ? "Galactic Overdue"
                          : "Perfect Execution"}
                      </span>
                    </div>
                  </div>
                  <div className="cosmic-meta">
                    <span className="meta-star">
                      <FiUser className="meta-pulsar" />
                      {task.createdBy?.name || "Unknown"}
                    </span>
                    <span className="meta-star">
                      <FiCalendar className="meta-pulsar" />
                      {new Date(task.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeeMyTask;
