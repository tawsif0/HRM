import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import {
  FiHome,
  FiFileText,
  FiSliders,
  FiSettings,
  FiUser,
  FiLogOut,
  FiCheckSquare,
  FiSquare,
  FiChevronDown,
  FiMenu,
  FiX,
  FiBell,
} from "react-icons/fi";
import { Dropdown } from "react-bootstrap";
import "./Dashboard.css";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [checkedItems] = useState({
    dashboard: false,
    pages: true,
    authentication: false,
    typography: false,
    color: true,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchUserData = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (error) {
        console.error("Error fetching user:", error);
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    toast.info("Logging out...", {
      autoClose: 1500,
      hideProgressBar: true,
      onClose: () => {
        localStorage.removeItem("token");
        navigate("/login");
      },
    });
  };

  const toggleMenu = (menu) => {
    setActiveMenu(activeMenu === menu ? "" : menu);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside
        className={`dashboard-sidebar ${
          isCollapsed ? "dashboard-collapsed" : ""
        }`}
      >
        <div className="dashboard-sidebar-header">
          <h2 className="dashboard-brand-text">
            {!isCollapsed && "Panel"}
            <button
              className="dashboard-menu-toggle"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <FiMenu /> : <FiX />}
            </button>
          </h2>
        </div>

        <nav className="dashboard-sidebar-nav">
          {/* Dashboard Item */}
          <div className="dashboard-nav-item">
            <FiHome className="dashboard-nav-icon" />
            {!isCollapsed && <span>Dashboard</span>}
          </div>
          <div className="divider"></div>
          {/* Pages Section */}
          <div className="dashboard-nav-section">
            <div
              className="dashboard-nav-header"
              onClick={() => toggleMenu("pages")}
            >
              <FiFileText className="dashboard-nav-icon" />
              {!isCollapsed && (
                <>
                  <span>Pages</span>
                  <FiChevronDown
                    className={`dashboard-arrow ${
                      activeMenu === "pages" ? "open" : ""
                    }`}
                  />
                </>
              )}
            </div>

            {!isCollapsed && activeMenu === "pages" && (
              <div className="dashboard-sub-menu">
                <div className="dashboard-sub-item">
                  {checkedItems.color ? (
                    <FiCheckSquare className="dashboard-check-icon" />
                  ) : (
                    <FiSquare className="dashboard-check-icon" />
                  )}
                  <span>Roles</span>
                </div>
                <div className="divider"></div>
                <div className="dashboard-bullet-items">
                  <div className="dashboard-bullet-item">
                    <span className="dashboard-bullet">•</span>
                    <Link className="dashboard-contents" to="/">
                      Create
                    </Link>
                  </div>
                  <div className="divider"></div>
                  <div className="dashboard-bullet-item">
                    <span className="dashboard-bullet">•</span>
                    <Link className="dashboard-contents" to="/">
                      Assign
                    </Link>
                  </div>
                  <div className="divider"></div>
                </div>
              </div>
            )}
          </div>
          <div className="divider"></div>
          {/* Utilities Section */}
          <div className="dashboard-nav-section">
            <div
              className="dashboard-nav-header"
              onClick={() => toggleMenu("utilities")}
            >
              <FiSliders className="dashboard-nav-icon" />
              {!isCollapsed && (
                <>
                  <span>Utilities</span>
                  <FiChevronDown
                    className={`dashboard-arrow ${
                      activeMenu === "utilities" ? "open" : ""
                    }`}
                  />
                </>
              )}
            </div>
            <div className="divider"></div>
            {!isCollapsed && activeMenu === "utilities" && (
              <div className="dashboard-sub-menu">
                <div className="dashboard-sub-item">
                  <span>Typography</span>
                </div>
                <div className="dashboard-sub-item">
                  {checkedItems.color ? (
                    <FiCheckSquare className="dashboard-check-icon" />
                  ) : (
                    <FiSquare className="dashboard-check-icon" />
                  )}
                  <span>Color</span>
                </div>
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`dashboard-main ${isCollapsed ? "dashboard-collapsed" : ""}`}
      >
        {/* Top Navigation */}
        <div className="dashboard-top-nav">
          <div className="dashboard-user-greeting">
            <h3>{user?.fullName || "User"}'s Dashboard</h3>
          </div>

          <div className="dashboard-top-nav-right">
            <FiBell size={24} className="dashboard-notification-icon" />
            <Dropdown show={showSettings} onToggle={setShowSettings}>
              <Dropdown.Toggle
                variant="link"
                className="dashboard-settings-toggle"
              >
                <FiSettings size={24} />
              </Dropdown.Toggle>

              <Dropdown.Menu align="end" className="dashboard-settings-menu">
                <Dropdown.Item className="dashboard-settings-item">
                  <FiUser className="me-2" />
                  Account Settings
                </Dropdown.Item>
                <Dropdown.Item
                  className="dashboard-settings-item"
                  onClick={handleLogout}
                >
                  <FiLogOut className="me-2" />
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="dashboard-content-area">
          {/* Add your main content here */}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
