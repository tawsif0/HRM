/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  FiLock,
  FiPhone,
  FiMail,
  FiSave,
  FiUser,
  FiEye,
  FiEyeOff
} from "react-icons/fi";
import "./AccountSettings.css";

const AccountSettings = ({ user }) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [username, setUsername] = useState(user?.fullName || "");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  const handleSaveChanges = async () => {
    setIsLoading(true);
    const updatedData = {
      fullName: username,
      phone,
      email,
      password
    };

    try {
      const token = localStorage.getItem("token");
      await axios.put("http://localhost:5000/api/user/profile", updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Account settings updated successfully!");
    } catch (err) {
      toast.error("Error updating settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="account-settings-container">
      <h3 className="account-settings-title">Account Settings</h3>

      <div className="account-settings-form">
        {user?.role?.name !== "admin" && (
          <div className="account-settings-input-group">
            <label>Username</label>
            <div className="account-settings-input-icon">
              <FiUser />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>
        )}

        {user?.role?.name !== "admin" && (
          <div className="account-settings-input-group">
            <label>Email</label>
            <div className="account-settings-input-icon">
              <FiMail />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="account-settings-input-group">
          <label>Phone</label>
          <div className="account-settings-input-icon">
            <FiPhone />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="account-settings-input-group">
          <label>Password</label>
          <div className="account-settings-input-icon">
            <FiLock />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              className="account-settings-eye"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEye /> : <FiEyeOff />}
            </span>
          </div>
        </div>

        <button
          onClick={handleSaveChanges}
          className="account-settings-save-btn"
          disabled={isLoading}
        >
          {isLoading ? (
            "Saving..."
          ) : (
            <>
              <FiSave /> Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AccountSettings;
