import { MapPin, Phone, Mail } from "lucide-react";

import "../styles/footer.css";

function Footer() {
  return (
    <footer className="footer-section">
      <div className="footer-container">
        {/* BRAND */}

        <div className="footer-brand">
          <h2>RideRent</h2>

          <p>
            Your trusted partner for safe, comfortable and reliable journeys.
          </p>

          <div className="social-icons">
            <a href="#">f</a>

            <a href="#">in</a>
          </div>
        </div>

        {/* QUICK LINKS */}

        <div className="footer-column">
          <h3>Quick Links</h3>

          <a href="#">Home</a>

          <a href="#">About Us</a>

          <a href="#">Vehicles</a>

          <a href="#">Contact</a>
        </div>

        {/* SERVICES */}

        <div className="footer-column">
          <h3>Our Services</h3>

          <a href="#">Car Rental</a>

          <a href="#">Ambulance Service</a>

          <a href="#">Driver Service</a>

          <a href="#">Corporate Travel</a>
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
            +8801711159101
          </p>

          <p>
            <Mail />
            support@riderent.com
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
