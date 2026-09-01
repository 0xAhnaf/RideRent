import {
  Menu,
  X,
  UserCircle,
  LogOut,
  LayoutDashboard,
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

  const [profileOpen, setProfileOpen] =
    useState(false);

  const navigate = useNavigate();

  const location = useLocation();

  const {
    user,
    isAuthenticated,
    logout,
  } = useAuth();

  /*
  |--------------------------------------------------------------------------
  | Scroll To Landing Page Section
  |--------------------------------------------------------------------------
  */

  const scrollToSection = (sectionId) => {
    setOpen(false);
    setProfileOpen(false);

    /*
    |--------------------------------------------------------------------------
    | Already On Home Page
    |--------------------------------------------------------------------------
    */

    if (location.pathname === "/") {
      const targetSection =
        document.getElementById(sectionId);

      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Go Home Then Scroll
    |--------------------------------------------------------------------------
    */

    navigate("/", {
      state: {
        scrollTo: sectionId,
      },
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Navigation Functions
  |--------------------------------------------------------------------------
  */

  const goToVehiclesPage = () => {
    setOpen(false);
    setProfileOpen(false);

    navigate("/vehicles");
  };

  const goToLogin = () => {
    setOpen(false);
    setProfileOpen(false);

    navigate("/login");
  };

  const goToSignup = () => {
    setOpen(false);
    setProfileOpen(false);

    navigate("/signup");
  };

  const goToDashboard = () => {
    setOpen(false);
    setProfileOpen(false);

    navigate("/admin");
  };

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const handleLogout = async () => {
    setProfileOpen(false);
    setOpen(false);

    try {
      await logout();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Mobile Menu
  |--------------------------------------------------------------------------
  */

  const toggleMobileMenu = () => {
    setOpen(
      (previousOpen) => !previousOpen
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Profile Menu
  |--------------------------------------------------------------------------
  */

  const toggleProfileMenu = () => {
    setProfileOpen(
      (previousOpen) => !previousOpen
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Role Check
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | Backend stores "admin" in lowercase.
  |
  */

  const isAdmin =
    user?.role === "admin";

  return (
    <nav className="navbar">
      {/* ================================================================
          LOGO
          ================================================================= */}

      <div
        className="nav-logo"
        onClick={() =>
          scrollToSection("home")
        }
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
          alt="RideRent Logo"
        />
      </div>

      {/* ================================================================
          NAVIGATION LINKS
          ================================================================= */}

      <ul
        className={`nav-links ${
          open ? "active" : ""
        }`}
      >
        <li
          onClick={() =>
            scrollToSection("home")
          }
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

        <li onClick={goToVehiclesPage}>
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
          USER ACTIONS
          ================================================================= */}

      <div
        className={`nav-actions ${
          open ? "active" : ""
        }`}
      >
        {!isAuthenticated ? (
          <>
            {/* ------------------------------------------------------------
                Logged Out
                ------------------------------------------------------------ */}

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
              Find Rent
            </button>
          </>
        ) : (
          <>
            {/* ------------------------------------------------------------
                Admin Dashboard Button
                ------------------------------------------------------------ */}

            {isAdmin && (
              <button
                type="button"
                className="dashboard-btn"
                onClick={goToDashboard}
              >
                <LayoutDashboard
                  size={18}
                />

                <span>
                  Dashboard
                </span>
              </button>
            )}

            {/* ------------------------------------------------------------
                Profile
                ------------------------------------------------------------ */}

            <div className="profile-container">
              <button
                type="button"
                className="profile-btn"
                onClick={toggleProfileMenu}
                aria-expanded={
                  profileOpen
                }
                aria-label="Open profile menu"
              >
                <UserCircle
                  size={30}
                />

                <span className="profile-name">
                  {user?.name}
                </span>
              </button>

              {/* ----------------------------------------------------------
                  Profile Dropdown
                  ---------------------------------------------------------- */}

              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-info">
                    <UserCircle
                      size={38}
                    />

                    <div>
                      <strong>
                        {user?.name}
                      </strong>

                      <span>
                        {user?.role}
                      </span>
                    </div>
                  </div>

                  <div className="profile-divider" />

                  <button
                    type="button"
                    className="profile-logout"
                    onClick={
                      handleLogout
                    }
                  >
                    <LogOut
                      size={18}
                    />

                    <span>
                      Logout
                    </span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ================================================================
          MOBILE MENU BUTTON
          ================================================================= */}

      <div
        className="mobile-menu"
        onClick={
          toggleMobileMenu
        }
        role="button"
        tabIndex={0}
        aria-label={
          open
            ? "Close navigation menu"
            : "Open navigation menu"
        }
        aria-expanded={open}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            toggleMobileMenu();
          }
        }}
      >
        {open ? (
          <X size={30} />
        ) : (
          <Menu size={30} />
        )}
      </div>
    </nav>
  );
}

export default Navbar;