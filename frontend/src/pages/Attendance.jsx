/* eslint-disable no-unused-vars */
// Attendance.jsx (final dropdown, user calendar, modal, presence count, and holiday management)
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FiCalendar, FiUserCheck, FiChevronDown, FiX } from "react-icons/fi";
import Calendar from "react-calendar";
import Modal from "react-modal";
import "./Dashboard.css";
import "./Calendar.css";

const getDayNumber = (dayName) =>
  [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ].indexOf(dayName);

const getLocalDateString = (date) => new Date(date).toLocaleDateString("en-CA");

const Attendance = () => {
  const [users, setUsers] = useState([]);
  const [weekend, setWeekend] = useState("Friday");
  const [holidayInput, setHolidayInput] = useState("");
  const [attendanceCounts, setAttendanceCounts] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userAttendance, setUserAttendance] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [absentReason, setAbsentReason] = useState("");

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const filteredUsers = res.data.filter((u) => u.role?.name !== "admin");
      setUsers(filteredUsers);

      const attRes = await axios.get(
        "http://localhost:5000/api/attendance/all",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAttendanceCounts(attRes.data);
    } catch (err) {
      toast.error("Error fetching users or attendance");
    }
  };

  const fetchUserAttendanceDetails = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/attendance/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserAttendance(res.data);
    } catch (err) {
      toast.error("Error loading user attendance history");
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
              const localDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                day
              );
              return localDate.toLocaleDateString("en-CA"); // Format: YYYY-MM-DD
            }),
        },
        { headers: { Authorization: `Bearer ${token}` } }
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
    const absent = userAttendance.find(
      (att) =>
        getLocalDateString(att.date) === getLocalDateString(date) &&
        att.status === "Absent"
    );
    if (absent) {
      setAbsentReason(absent.reason);
      setModalOpen(true);
    }
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
          onClickDay={(date) => {
            const day = date.getDate();
            const parts = holidayInput
              .split(",")
              .map((d) => parseInt(d.trim()))
              .filter((d) => !isNaN(d));
            const updated = parts.includes(day)
              ? parts.filter((d) => d !== day)
              : [...parts, day];
            updated.sort((a, b) => a - b);
            setHolidayInput(updated.join(", "));
          }}
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
          <div key={user._id} className="user-card-wrapper">
            <div
              className="user-card"
              onClick={() => {
                if (selectedUserId === user._id) {
                  setSelectedUserId(null);
                } else {
                  fetchUserAttendanceDetails(user._id);
                  setSelectedUserId(user._id);
                }
              }}
            >
              <div className="user-info">
                <div className="user-avatar">{user.fullName.charAt(0)}</div>
                <div>
                  <div className="user-name">{user.fullName}</div>
                  <small>{user.role?.name}</small>
                </div>
              </div>
              <div className="attendance-count-dropdown">
                <strong>
                  {attendanceCounts[user._id] || 0} / {workingDays} Days
                </strong>
                <FiChevronDown className="dropdown-icon" />
              </div>
            </div>

            {selectedUserId === user._id && (
              <div className="calendar-dropdown-container">
                <Calendar
                  tileClassName={({ date }) => {
                    const found = userAttendance.find(
                      (att) =>
                        getLocalDateString(att.date) ===
                        getLocalDateString(date)
                    );
                    if (!found) return null;
                    if (found.status === "Present") return "present-day";
                    if (found.status === "Absent") return "absent-day";
                    return null;
                  }}
                  onClickDay={handleDateClick}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        className="absent-modal"
        overlayClassName="modal-overlay"
      >
        <div className="modal-header">
          <h4>Reason for Absence</h4>
          <FiX onClick={() => setModalOpen(false)} className="close-icon" />
        </div>
        <div className="modal-body">
          <p>{absentReason}</p>
        </div>
      </Modal>
    </div>
  );
};

export default Attendance;
