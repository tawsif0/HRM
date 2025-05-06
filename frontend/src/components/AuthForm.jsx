/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiUser,
  FiMail,
  FiPhone,
} from "react-icons/fi";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AuthForm.css";

const passwordCriteria = [
  { label: "Minimum 8 characters", test: (p) => p.length >= 8 },
  { label: "At least one uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "At least one lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "At least one number", test: (p) => /\d/.test(p) },
  {
    label: "At least one special character",
    test: (p) => /[!@#$%^&*]/.test(p),
  },
];

const AuthForm = ({ isLogin }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setFormData({
      fullName: "",
      phone: "",
      email: "",
      password: "",
    });
    setPasswordInput("");
    setFormErrors({});
    setPasswordTouched(false);
  }, [location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.email) errors.email = "Email is required.";
    if (!formData.password) errors.password = "Password is required.";
    if (!isLogin) {
      if (!formData.fullName) errors.fullName = "Full name is required.";
      if (!formData.phone) errors.phone = "Phone number is required.";
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const endpoint = isLogin ? "login" : "register";
      const url = `http://localhost:5000/api/auth/${endpoint}`;

      // Convert email to lowercase before sending
      const payload = {
        ...formData,
        email: formData.email.toLowerCase(),
      };

      const res = await axios.post(url, payload);

      if (isLogin) {
        if (!res.data.user.role) {
          toast.error("Wait for role assignment from the admin.");
          return;
        }

        localStorage.setItem("token", res.data.token);
        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        toast.success("Registration successful! Wait for role assignment.");
        navigate("/login");
      }
    } catch (err) {
      const errors = err.response?.data?.errors || [
        { msg: err.response?.data?.message || "Something went wrong" },
      ];
      errors.forEach((error) => toast.error(error.msg));
    }
  };

  return (
    <div className="auth-container">
      <div className="floating-blob blob-1"></div>
      <div className="floating-blob blob-2"></div>

      <form onSubmit={handleSubmit} className="auth-form">
        <h2 className="form-title neon-text">
          {isLogin ? "Welcome Back 💫" : "Create Account 🚀"}
        </h2>

        {!isLogin && (
          <>
            <div className="form-group">
              <FiUser className="input-icon" />
              <input
                type="text"
                placeholder="Full Name"
                value={formData.fullName}
                className="form-control glow-input"
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
              />
              {formErrors.fullName && (
                <div className="error-message">{formErrors.fullName}</div>
              )}
            </div>

            <div className="form-group phone-wrapper">
              <FiPhone className="input-icon" />
              <PhoneInput
                international
                defaultCountry="BD"
                placeholder="Enter phone number"
                value={formData.phone}
                className="phone-input glow-input"
                onChange={(phone) =>
                  setFormData({ ...formData, phone: phone || "" })
                }
              />
              {formErrors.phone && (
                <div className="error-message">{formErrors.phone}</div>
              )}
            </div>
          </>
        )}

        <div className="form-group">
          <FiMail className="input-icon" />
          <input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            className="form-control glow-input"
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          {formErrors.email && (
            <div className="error-message">{formErrors.email}</div>
          )}
        </div>

        <div className="form-group position-relative">
          <FiLock className="input-icon" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={passwordInput}
            className="form-control glow-input"
            onBlur={() => setPasswordTouched(true)}
            onChange={(e) => {
              setPasswordInput(e.target.value);
              setFormData({ ...formData, password: e.target.value });
            }}
          />
          {showPassword ? (
            <FiEye
              className="toggle-password"
              onClick={() => setShowPassword(false)}
            />
          ) : (
            <FiEyeOff
              className="toggle-password"
              onClick={() => setShowPassword(true)}
            />
          )}
          {formErrors.password && (
            <div className="error-message">{formErrors.password}</div>
          )}
        </div>

        {!isLogin && passwordInput.length > 0 && (
          <ul className="password-criteria mt-2">
            {passwordCriteria.map((crit, index) => {
              const passed = crit.test(passwordInput);
              return (
                <li
                  key={index}
                  style={{
                    color: passed ? "#39ff14" : "red",
                    position: "relative",
                    paddingLeft: "20px",
                  }}
                >
                  {crit.label}
                </li>
              );
            })}
          </ul>
        )}

        <div className="btn-wrapper mt-3">
          <button type="submit" className="submit-btn pulse-on-hover">
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </div>

        <p className="auth-link text-center">
          {isLogin ? "New here? " : "Already have an account? "}
          <Link to={isLogin ? "/register" : "/login"} className="neon-link">
            {isLogin ? "Create Account" : "Login Now"}
          </Link>
        </p>
      </form>
    </div>
  );
};

export default AuthForm;
