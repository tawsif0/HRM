import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { FiChevronDown, FiX } from "react-icons/fi";
import Calendar from "react-calendar";
import Modal from "react-modal";
import "./Dashboard.css";
import "./Calendar.css";

const getLocalDateString = (date) => {
  return new Date(date).toLocaleDateString("en-CA"); // YYYY-MM-DD
};

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

const MyAttendance = ({ user }) => {
  const [attendance, setAttendance] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [absentReason, setAbsentReason] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [presentCount, setPresentCount] = useState(0);
  const [workingDays, setWorkingDays] = useState(0);
  const [weekend, setWeekend] = useState("Friday");
  const [holidayInput, setHolidayInput] = useState("");

  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/attendance/user/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const all = res.data;
      setAttendance(all);

      // Count only current month's present records (match year and month)
      const now = new Date();
      const filtered = all.filter((a) => {
        const d = new Date(a.date);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });

      setPresentCount(filtered.filter((a) => a.status === "Present").length);
    } catch (err) {
      console.error("Error fetching attendance:", err);
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
      console.error("Error fetching holidays:", err);
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
    fetchAttendance();
    fetchHolidays();
  }, []);

  useEffect(() => {
    setWorkingDays(calculateWorkingDays());
  }, [calculateWorkingDays]);

  const handleDayClick = (date) => {
    const match = attendance.find(
      (a) =>
        getLocalDateString(a.date) === getLocalDateString(date) &&
        a.status === "Absent"
    );
    if (match) {
      setAbsentReason(match.reason);
      setModalOpen(true);
    }
  };

  if (!user || !user.fullName) return <p>Loading your attendance...</p>;

  return (
    <div className="form-container">
      <div className="user-card-wrapper">
        <div
          className="user-card"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <div className="user-info">
            <div className="user-avatar">{user.fullName.charAt(0)}</div>
            <div>
              <div className="user-name">{user.fullName}</div>
              <small>{user.role?.name || "Employee"}</small>
            </div>
          </div>
          <div className="attendance-count-dropdown">
            <strong>
              {presentCount} / {workingDays} Days
            </strong>
            <FiChevronDown className="dropdown-icon" />
          </div>
        </div>

        {dropdownOpen && (
          <div className="calendar-dropdown-container">
            <Calendar
              tileClassName={({ date }) => {
                const match = attendance.find(
                  (a) => getLocalDateString(a.date) === getLocalDateString(date)
                );
                if (!match) return null;
                if (match.status === "Present") return "present-day";
                if (match.status === "Absent") return "absent-day";
                return null;
              }}
              onClickDay={handleDayClick}
            />
          </div>
        )}
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

export default MyAttendance;
