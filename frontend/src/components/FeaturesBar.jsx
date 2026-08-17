import {
  ShieldCheck,
  UserRoundCheck,
  CalendarCheck,
  BadgeDollarSign,
  Headphones,
} from "lucide-react";

import "../styles/features.css";

function FeaturesBar() {
  return (
    <section className="features-wrapper">
      <div className="feature-box">
        <div className="feature-item">
          <ShieldCheck />

          <div>
            <h4>WELL MAINTAINED</h4>

            <p>Vehicles in top condition</p>
          </div>
        </div>

        <div className="feature-item">
          <UserRoundCheck />

          <div>
            <h4>EXPERIENCED DRIVERS</h4>

            <p>Safe, professional, reliable</p>
          </div>
        </div>

        <div className="feature-item">
          <CalendarCheck />

          <div>
            <h4>EASY BOOKING</h4>

            <p>Quick and hassle-free</p>
          </div>
        </div>

        <div className="feature-item">
          <BadgeDollarSign />

          <div>
            <h4>BEST PRICES</h4>

            <p>Competitive and transparent</p>
          </div>
        </div>

        <div className="feature-item">
          <Headphones />

          <div>
            <h4>24/7 SUPPORT</h4>

            <p>We are always here for you</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesBar;
