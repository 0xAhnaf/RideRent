import { MapPin, Phone, Mail } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import "../styles/footer.css";

function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (sectionId) => {
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
    navigate("/vehicles");
  };

  return (
    <footer className="footer-section">
      <div className="footer-container">
        {/* BRAND */}
        <div className="footer-brand">
          <h2>RideRent</h2>

          <p>
            Your trusted partner for safe, comfortable and reliable journeys.
          </p>
        </div>

        {/* QUICK LINKS */}
        <div className="footer-column">
          <h3>Quick Links</h3>

          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection("home");
            }}
          >
            Home
          </a>

          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection("about");
            }}
          >
            About Us
          </a>

          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              goToVehiclesPage();
            }}
          >
            Vehicles
          </a>

          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection("contact");
            }}
          >
            Contact
          </a>
        </div>

        {/* SERVICES */}
        <div className="footer-column">
          <h3>Our Services</h3>

          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection("booking");
            }}
          >
            Car Rental
          </a>

          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection("ambulance");
            }}
          >
            Ambulance Service
          </a>

          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection("booking");
            }}
          >
            Driver Service
          </a>

          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              scrollToSection("booking");
            }}
          >
            Corporate Travel
          </a>
        </div>

        {/* CONTACT */}
        <div className="footer-column">
          <h3>Contact</h3>

          <p>
            <MapPin />
            Dhaka, Bangladesh
          </p>

          <p>
            <Phone />
            <a href="tel:+8801711159101">+8801711159101</a>
          </p>

          <p>
            <Mail />
            <a href="mailto:support@riderent.com">
              support@riderent.com
            </a>
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 RideRent. All Rights Reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;