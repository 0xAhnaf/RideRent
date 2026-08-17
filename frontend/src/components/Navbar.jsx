import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import logo from "../assets/logo.png";
import "../styles/navbar.css";

function Navbar() {
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (sectionId) => {
    setOpen(false);

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

  const goToVehiclesPage = () => {
    setOpen(false);
    navigate("/vehicles");
  };

  const goToLogin = () => {
    setOpen(false);
    navigate("/login");
  };

  const goToSignup = () => {
    setOpen(false);
    navigate("/signup");
  };

  const toggleMobileMenu = () => {
    setOpen((previousOpen) => !previousOpen);
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <div
        className="nav-logo"
        onClick={() => scrollToSection("home")}
        role="button"
        tabIndex={0}
        aria-label="Go to RideRent home"
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            scrollToSection("home");
          }
        }}
      >
        <img src={logo} alt="RideRent Logo" />
      </div>

      {/* Menu */}
      <ul className={`nav-links ${open ? "active" : ""}`}>
        <li onClick={() => scrollToSection("home")}>Home</li>

        <li onClick={() => scrollToSection("ambulance")}>Ambulance</li>

        <li onClick={goToVehiclesPage}>Vehicles</li>

        <li onClick={() => scrollToSection("about")}>About Us</li>

        <li onClick={() => scrollToSection("contact")}>Contact</li>
      </ul>

      {/* Buttons */}
      <div className={`nav-actions ${open ? "active" : ""}`}>
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
          onClick={() => scrollToSection("booking")}
        >
          Find Rent
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className="mobile-menu"
        onClick={toggleMobileMenu}
        role="button"
        tabIndex={0}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            toggleMobileMenu();
          }
        }}
      >
        {open ? <X size={30} /> : <Menu size={30} />}
      </div>
    </nav>
  );
}

export default Navbar;