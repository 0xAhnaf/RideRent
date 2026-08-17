import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import FeaturesBar from "../components/FeaturesBar";
import BookingSection from "../components/BookingSection";
import AmbulanceSection from "../components/AmbulanceSection";
import AboutSection from "../components/AboutSection";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";
import FadeIn from "../components/FadeIn";

function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    const sectionId = location.state?.scrollTo;

    if (!sectionId) {
      return undefined;
    }

    const scrollTimer = setTimeout(() => {
      const targetSection = document.getElementById(sectionId);

      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 150);

    return () => clearTimeout(scrollTimer);
  }, [location.key, location.state]);

  return (
    <>
      <Navbar />

      <div id="home" className="page-section">
        <HeroSection />
      </div>

      <FadeIn>
        <FeaturesBar />
      </FadeIn>

      <FadeIn delay={0.1}>
        <div id="booking" className="page-section">
          <BookingSection />
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div id="ambulance" className="page-section">
          <AmbulanceSection />
        </div>
      </FadeIn>

      <FadeIn delay={0.3}>
        <div id="about" className="page-section">
          <AboutSection />
        </div>
      </FadeIn>

      <FadeIn delay={0.4}>
        <div id="contact" className="page-section">
          <ContactSection />
        </div>
      </FadeIn>

      <Footer />
    </>
  );
}

export default LandingPage;
