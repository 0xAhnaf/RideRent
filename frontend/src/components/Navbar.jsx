import {
  Menu,
  X,
  UserCircle,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  CarFront,
} from "lucide-react";

import { useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import logo from "../assets/logo.png";

import { useAuth } from "../context/AuthContext";

import "../styles/navbar.css";

function Navbar() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    isAuthenticated,
    logout,
  } = useAuth();

  const isAdmin = user?.role === "admin";

  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

  const closeMenus = () => {
    setOpen(false);
    setProfileOpen(false);
  };

  const scrollToSection = (sectionId) => {
    closeMenus();

    if (location.pathname === "/") {
      const targetSection = document.getElementById(sectionId);

      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      return;
    }

    navigate("/", {
      state: {
        scrollTo: sectionId,
      },
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const goToVehiclesPage = () => {
    closeMenus();
    navigate("/vehicles");
  };

  const goToLogin = () => {
    closeMenus();
    navigate("/login");
  };

  const goToSignup = () => {
    closeMenus();
    navigate("/signup");
  };

  const goToDashboard = () => {
    closeMenus();
    navigate("/admin");
  };

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const handleLogout = async () => {
    closeMenus();

    try {
      await logout();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Mobile Menu
  |--------------------------------------------------------------------------
  */

  const toggleMobileMenu = () => {
    setOpen((previousOpen) => !previousOpen);
    setProfileOpen(false);
  };

  /*
  |--------------------------------------------------------------------------
  | Profile Menu
  |--------------------------------------------------------------------------
  */

  const toggleProfileMenu = () => {
    setProfileOpen((previousOpen) => !previousOpen);
  };

  /*
  |--------------------------------------------------------------------------
  | Active Navigation
  |--------------------------------------------------------------------------
  */

  const isHome = location.pathname === "/";
  const isVehicles = location.pathname === "/vehicles";

  /*
  |--------------------------------------------------------------------------
  | User Initial
  |--------------------------------------------------------------------------
  */

  const userInitial =
    user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <nav className="navbar">

      {/* ================================================================
          LOGO
          ================================================================ */}

      <div
        className="nav-logo"
        onClick={() => scrollToSection("home")}
        role="button"
        tabIndex={0}
        aria-label="Go to RideRent home"
        onKeyDown={(event) => {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            scrollToSection("home");
          }
        }}
      >
        <img
          src={logo}
          alt="RideRent"
        />
      </div>


      {/* ================================================================
          NAVIGATION LINKS
          ================================================================ */}

      <ul
        className={`nav-links ${
          open ? "active" : ""
        }`}
      >
        <li
          className={isHome ? "active-link" : ""}
          onClick={() => scrollToSection("home")}
        >
          Home
        </li>

        <li
          onClick={() =>
            scrollToSection("ambulance")
          }
        >
          Ambulance
        </li>

        <li
          className={isVehicles ? "active-link" : ""}
          onClick={goToVehiclesPage}
        >
          Vehicles
        </li>

        <li
          onClick={() =>
            scrollToSection("about")
          }
        >
          About Us
        </li>

        <li
          onClick={() =>
            scrollToSection("contact")
          }
        >
          Contact
        </li>
      </ul>


      {/* ================================================================
          RIGHT SIDE ACTIONS
          ================================================================ */}

      <div
        className={`nav-actions ${
          open ? "active" : ""
        }`}
      >

        {/* ==============================================================
            LOGGED OUT
            ============================================================== */}

        {!isAuthenticated ? (
          <>

            <button
              type="button"
              className="login-btn"
              onClick={goToLogin}
            >
              Login
            </button>

            <button
              type="button"
              className="signup-btn"
              onClick={goToSignup}
            >
              Sign Up
            </button>

            <button
              type="button"
              className="book-btn"
              onClick={() =>
                scrollToSection("booking")
              }
            >
              <CarFront size={17} />
              <span>Find Rent</span>
            </button>

          </>
        ) : (

          /* ==============================================================
             LOGGED IN
             ============================================================== */

          <div className="logged-in-actions">

            {/* ----------------------------------------------------------
                ADMIN DASHBOARD
                ---------------------------------------------------------- */}

            {isAdmin && (
              <button
                type="button"
                className="dashboard-btn"
                onClick={goToDashboard}
              >
                <LayoutDashboard size={18} />

                <span>
                  Dashboard
                </span>
              </button>
            )}


            {/* ----------------------------------------------------------
                PROFILE
                ---------------------------------------------------------- */}

            <div className="profile-container">

              <button
                type="button"
                className={`profile-btn ${
                  profileOpen
                    ? "profile-btn-open"
                    : ""
                }`}
                onClick={toggleProfileMenu}
                aria-expanded={profileOpen}
                aria-label="Open profile menu"
              >

                <span className="profile-avatar">
                  {userInitial}
                </span>

                <span className="profile-name">
                  {user?.name || "User"}
                </span>

                <ChevronDown
                  size={17}
                  className={`profile-chevron ${
                    profileOpen
                      ? "rotate"
                      : ""
                  }`}
                />

              </button>


              {/* --------------------------------------------------------
                  PROFILE DROPDOWN
                  -------------------------------------------------------- */}

              {profileOpen && (
                <div className="profile-dropdown">

                  <div className="profile-info">

                    <div className="profile-avatar large">
                      {userInitial}
                    </div>

                    <div className="profile-details">

                      <strong>
                        {user?.name || "User"}
                      </strong>

                      <span>
                        {user?.email || ""}
                      </span>

                      <small>
                        {user?.role === "admin"
                          ? "Administrator"
                          : "Renter"}
                      </small>

                    </div>

                  </div>


                  <div className="profile-divider" />


                  {isAdmin && (
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={goToDashboard}
                    >
                      <LayoutDashboard size={18} />

                      <span>
                        Dashboard
                      </span>
                    </button>
                  )}


                  <button
                    type="button"
                    className="dropdown-item logout-item"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />

                    <span>
                      Logout
                    </span>
                  </button>

                </div>
              )}

            </div>

          </div>
        )}

      </div>


      {/* ================================================================
          MOBILE MENU
          ================================================================ */}

      <button
        type="button"
        className="mobile-menu"
        onClick={toggleMobileMenu}
        aria-label={
          open
            ? "Close navigation menu"
            : "Open navigation menu"
        }
        aria-expanded={open}
      >
        {open ? (
          <X size={27} />
        ) : (
          <Menu size={27} />
        )}
      </button>

    </nav>
  );
}

export default Navbar;
