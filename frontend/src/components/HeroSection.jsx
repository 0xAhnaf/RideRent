import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import heroBackground from "../assets/hero-background.png";
import heroCars from "../assets/hero-car4.png";

import "../styles/hero.css";

function HeroSection() {
  const navigate = useNavigate();

  const scrollToBookingSection = () => {
    const bookingSection = document.getElementById("booking");

    if (bookingSection) {
      bookingSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const goToVehiclesPage = () => {
    navigate("/vehicles");
  };

  return (
    <>
      <section className="hero-section">
        <img className="hero-background" src={heroBackground} alt="" />

        <div className="hero-content">
          <p className="hero-label">Reliable Car Rental Service</p>

          <h1 className="hero-heading">
            Your Journey,
            <span>Our Priority</span>
          </h1>

          <p className="hero-description">
            Book reliable cars, SUVs, microbuses, and emergency transport
            services with a simple and transparent booking process.
          </p>

          <div className="hero-buttons">
            <button
              type="button"
              className="hero-primary-button"
              onClick={scrollToBookingSection}
            >
              Book My Ride
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              className="hero-secondary-button"
              onClick={goToVehiclesPage}
            >
              Explore Vehicles
            </button>
          </div>

          <div className="hero-trust-list">{/* Existing trust items */}</div>
        </div>

        <div className="hero-visual">
          <img className="hero-cars" src={heroCars} alt="RideRent vehicles" />
        </div>
      </section>
    </>
  );
}

export default HeroSection;
