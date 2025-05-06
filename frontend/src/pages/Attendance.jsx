/* eslint-disable no-unused-vars */
// Attendance.jsx (final: custom weekend/holiday logic, red highlights, and presence count)
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FiCalendar, FiUserCheck } from "react-icons/fi";
import Calendar from "react-calendar";
import "./Dashboard.css";
import "./Calendar.css"; // <-- Custom CSS file

const getDayNumber = (dayName) => {
  return [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ].indexOf(dayName);
};

const Attendance = () => {
  const [users, setUsers] = useState([]);
  const [weekend, setWeekend] = useState("Friday");
  const [holidayInput, setHolidayInput] = useState("");
  const [attendanceCounts, setAttendanceCounts] = useState({});

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const filteredUsers = res.data.filter((u) => u.role?.name !== "admin");
      setUsers(filteredUsers);

      // Fetch attendance counts for users
      const attRes = await axios.get(
        "http://localhost:5000/api/attendance/all",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAttendanceCounts(attRes.data); // object with userId: presentCount
    } catch (err) {
      toast.error("Error fetching users or attendance");
    }
  };

  const fetchHolidays = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/holidays", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWeekend(res.data.weekend);
      const dates = res.data.holidays.map((d) => new Date(d));
      setHolidayInput(
        dates
          .map((d) => d.getDate())
          .sort((a, b) => a - b)
          .join(", ")
      );
    } catch (err) {
      toast.error("Error fetching holidays");
    }
  };

  const saveHolidays = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/holidays",
        {
          weekend,
          holidays: holidayInput
            .split(",")
            .map((d) => parseInt(d.trim()))
            .filter((d) => !isNaN(d))
            .map((day) => {
              const now = new Date();
              return new Date(now.getFullYear(), now.getMonth(), day)
                .toISOString()
                .split("T")[0];
            }),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Holiday settings updated");
      fetchHolidays();
    } catch (err) {
      toast.error("Error saving holidays");
    }
  };

  const calculateWorkingDays = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const holidayDays = holidayInput
      .split(",")
      .map((d) => parseInt(d.trim()))
      .filter((d) => !isNaN(d));

    let count = 0;
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isWeekend = date.getDay() === getDayNumber(weekend);
      const isHoliday = holidayDays.includes(i);
      if (!isWeekend && !isHoliday) count++;
    }
    return count;
  }, [weekend, holidayInput]);

  useEffect(() => {
    fetchUsers();
    fetchHolidays();
  }, []);

  const handleDateClick = (date) => {
    const day = date.getDate();
    const parts = holidayInput
      .split(",")
      .map((d) => parseInt(d.trim()))
      .filter((d) => !isNaN(d));

    let updated;
    if (parts.includes(day)) {
      updated = parts.filter((d) => d !== day);
    } else {
      updated = [...parts, day];
    }

    updated.sort((a, b) => a - b);
    setHolidayInput(updated.join(", "));
  };

  const workingDays = calculateWorkingDays();

  return (
    <div className="form-container">
      <div className="form-header">
        <FiCalendar className="form-icon" />
        <h3>Holiday Management</h3>
      </div>
      <div className="form-group">
        <label className="h4">Select Weekend:</label>
        <div className="select-wrapper">
          <select
            className="holiday-select"
            value={weekend}
            onChange={(e) => setWeekend(e.target.value)}
          >
            {[
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ].map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>

        <label className="h4">Select Holidays for Current Month:</label>
        <Calendar
          calendarType="gregory"
          locale="en-BD"
          onClickDay={handleDateClick}
          tileClassName={({ date }) => {
            const now = new Date();
            const isCurrentMonth =
              date.getFullYear() === now.getFullYear() &&
              date.getMonth() === now.getMonth();
            const isWeekend = date.getDay() === getDayNumber(weekend);
            const isHoliday = holidayInput
              .split(",")
              .map((d) => parseInt(d.trim()))
              .includes(date.getDate());
            return isCurrentMonth && (isHoliday || isWeekend)
              ? "selected-holiday"
              : null;
          }}
        />

        <input
          type="text"
          value={holidayInput}
          onChange={(e) => setHolidayInput(e.target.value)}
          placeholder="Selected holiday dates"
          className="modern-input"
        />

        <button onClick={saveHolidays} className="gradient-button">
          Save Holiday Settings
        </button>
      </div>

      <div className="form-header">
        <FiUserCheck className="form-icon" />
        <h3>User Attendance Overview</h3>
      </div>
      <div className="user-list">
        {users.map((user) => (
          <div key={user._id} className="user-card">
            <div className="user-info">
              <div className="user-avatar">{user.fullName.charAt(0)}</div>
              <div>
                <div className="user-name">{user.fullName}</div>
                <small>{user.role?.name}</small>
              </div>
            </div>
            <div>
              <strong>
                {attendanceCounts[user._id] || 0} / {workingDays} Days
              </strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Attendance;
