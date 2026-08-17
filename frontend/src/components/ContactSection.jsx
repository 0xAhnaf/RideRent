import { Phone } from "lucide-react";

import owner1 from "../assets/owner1.png";
import owner2 from "../assets/owner2.jpeg";
import owner3 from "../assets/owner3.png";
import owner4 from "../assets/owner4.png";

import "../styles/contact.css";

function ContactSection() {
  const owners = [
    {
      name: "Shadab Arshad",
      phone: "+8801711159101",
      image: owner1,
    },

    {
      name: "Syed Raiyan Newaz",
      phone: "+8801795585875",
      image: owner2,
    },

    {
      name: "Kaushik Sarker",
      phone: "+8801577027715",
      image: owner3,
    },

    {
      name: "Kazi Ahnaf Islam",
      phone: "+8801625044420",
      image: owner4,
    },
  ];

  return (
    <section className="contact-section">
      <div className="contact-container">
        <div className="contact-header">
          <span>CONTACT RIDERENT</span>

          <h2>Owner's End</h2>

          <p>
            Have questions about booking or our services? Feel free to contact
            us anytime.
          </p>
        </div>

        <div className="owner-grid">
          {owners.map((owner) => (
            <div className="owner-card" key={owner.name}>
              <img
                src={owner.image}

                alt={owner.name}
              />

              <h3>{owner.name}</h3>

              <a href={`tel:${owner.phone}`}>
                <Phone size={16} />

                {owner.phone}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
