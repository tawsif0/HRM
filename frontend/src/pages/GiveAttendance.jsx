/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./GiveAttendance.css";

const GiveAttendance = ({ user }) => {
  const [status, setStatus] = useState(null);
  const [reason, setReason] = useState("");
  const [todayHoliday, setTodayHoliday] = useState(false);
  const [holidayLabel, setHolidayLabel] = useState("");
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true); // ✅ NEW loading state

  useEffect(() => {
    const checkHolidayAndAttendance = async () => {
      try {
        const token = localStorage.getItem("token");

        // Check holiday status
        const holidayRes = await axios.get(
          "http://localhost:5000/api/holidays",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const { holidays, weekend } = holidayRes.data;
        const now = new Date();
        const today = now.getDate();
        const dayName = now.toLocaleString("en-US", { weekday: "long" });

        if (holidays.some((d) => new Date(d).getDate() === today)) {
          setTodayHoliday(true);
          setHolidayLabel("Today is a holiday");
        } else if (dayName === weekend) {
          setTodayHoliday(true);
          setHolidayLabel("Today is the weekend");
        }

        // Check if attendance already submitted
        const attendanceRes = await axios.get(
          "http://localhost:5000/api/attendance/check",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (attendanceRes.data?.submitted) {
          setAlreadySubmitted(true);
        }
      } catch (err) {
        toast.error("Failed to load data.");
      } finally {
        setLoading(false); // ✅ FINISHED loading
      }
    };

    checkHolidayAndAttendance();
  }, []);

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/attendance",
        {
          status,
          reason: status === "Absent" ? reason : undefined,
          timestamp: new Date().toLocaleString("en-US", {
            timeZone: "Asia/Dhaka",
          }),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Attendance submitted successfully.");
      setStatus(null);
      setReason("");
      setAlreadySubmitted(true);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to submit attendance."
      );
    }
  };

  if (loading) {
    return (
      <div className="form-container give-attendance-section">
        <div className="form-header">
          <h3>Checking today's attendance...</h3>
        </div>
      </div>
    );
  }

  if (todayHoliday) {
    return (
      <div className="form-container give-attendance-section">
        <div className="form-header">
          <h3>{holidayLabel}</h3>
        </div>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="form-container give-attendance-section">
        <div className="form-header">
          <h3>Your attendance for today is already submitted.</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container give-attendance-section">
      <div className="form-header">
        <h3>Give Attendance</h3>
      </div>

      {status === null && (
        <div className="attendance-actions">
          <button
            className="attendance-btn present"
            onClick={() => setStatus("Present")}
          >
            Present
          </button>
          <button
            className="attendance-btn absent"
            onClick={() => setStatus("Absent")}
          >
            Absent
          </button>
        </div>
      )}

      {status === "Present" && (
        <div>
          <p>You marked yourself Present.</p>
          <button className="attendance-btn present" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      )}

      {status === "Absent" && (
        <div className="absent-input-box">
          <label>Reason for absence:</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Sick leave, Personal reason"
          />
          <button onClick={handleSubmit}>Save</button>
        </div>
      )}
    </div>
  );
};

export default GiveAttendance;
