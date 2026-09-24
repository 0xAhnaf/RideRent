import { MapPin, Phone, Ambulance } from "lucide-react";
import { useState } from "react";
import { locations } from "../data/locations";
import ambulanceOne from "../assets/ambulance.png";
import ambulanceTwo from "../assets/ambulance2.png";
import "../styles/ambulance.css";

function AmbulanceSection() {
  const [pickupDistrict, setPickupDistrict] = useState("");
  const [pickupThana, setPickupThana] = useState("");
  const [pickupThanas, setPickupThanas] = useState([]);
  const [pickupAddress, setPickupAddress] = useState("");

  const [destinationDistrict, setDestinationDistrict] = useState("");
  const [destinationThana, setDestinationThana] = useState("");
  const [destinationThanas, setDestinationThanas] = useState([]);
  const [destinationAddress, setDestinationAddress] = useState("");

  const [emergencyContact, setEmergencyContact] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const allDistricts = Object.values(locations).flatMap((division) =>
    Object.keys(division),
  );

  const getThanas = (district) => {
    let thanas = [];

    Object.values(locations).forEach((division) => {
      if (division[district]) {
        thanas = division[district];
      }
    });

    return thanas;
  };

  const handlePickupDistrictChange = (e) => {
    const district = e.target.value;

    setPickupDistrict(district);
    setPickupThana("");
    setPickupThanas(getThanas(district));
  };

  const handleDestinationDistrictChange = (e) => {
    const district = e.target.value;

    setDestinationDistrict(district);
    setDestinationThana("");
    setDestinationThanas(getThanas(district));
  };

  const handleBooking = async (e) => {
    e.preventDefault();

    setMessage("");

    if (
      !pickupDistrict ||
      !pickupThana ||
      !pickupAddress ||
      !destinationDistrict ||
      !destinationThana ||
      !destinationAddress ||
      !emergencyContact
    ) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (!/^01[3-9]\d{8}$/.test(emergencyContact)) {
      setMessage("Please enter a valid Bangladeshi mobile number.");
      return;
    }

    const token = localStorage.getItem("riderent_token");

    if (!token) {
      setMessage("Please login before booking an ambulance.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/ambulance-bookings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            pickup_district: pickupDistrict,
            pickup_thana: pickupThana,
            pickup_address: pickupAddress,
            destination_district: destinationDistrict,
            destination_thana: destinationThana,
            destination_address: destinationAddress,
            emergency_contact: emergencyContact,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setMessage("Your session has expired. Please login again.");
        } else if (response.status === 422) {
          setMessage("Please check your information and try again.");
        } else {
          setMessage(data.message || "Booking failed. Please try again.");
        }

        return;
      }

      setMessage("Ambulance booked successfully.");

      setPickupDistrict("");
      setPickupThana("");
      setPickupThanas([]);
      setPickupAddress("");

      setDestinationDistrict("");
      setDestinationThana("");
      setDestinationThanas([]);
      setDestinationAddress("");

      setEmergencyContact("");
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ambulance-section">
      <div className="ambulance-container">
        <div className="ambulance-form-box">
          <div className="ambulance-header">
            <h2>🚨 Emergency Ambulance Service</h2>

            <p>
              Fast and reliable ambulance support when every second matters.
            </p>
          </div>

          <form className="ambulance-scroll" onSubmit={handleBooking}>
            <div className="ambulance-field">
              <label>
                <MapPin size={16} />
                Pickup District
              </label>

              <select
                value={pickupDistrict}
                onChange={handlePickupDistrictChange}
              >
                <option value="">Select District</option>

                {allDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>

            <div className="ambulance-field">
              <label>
                <MapPin size={16} />
                Pickup Thana
              </label>

              <select
                value={pickupThana}
                onChange={(e) => setPickupThana(e.target.value)}
              >
                <option value="">Select Thana</option>

                {pickupThanas.map((thana) => (
                  <option key={thana} value={thana}>
                    {thana}
                  </option>
                ))}
              </select>
            </div>

            <div className="ambulance-field">
              <label>
                <MapPin size={16} />
                Pickup Address
              </label>

              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Enter pickup address"
              />
            </div>

            <div className="ambulance-field">
              <label>
                <MapPin size={16} />
                Destination District
              </label>

              <select
                value={destinationDistrict}
                onChange={handleDestinationDistrictChange}
              >
                <option value="">Select District</option>

                {allDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>

            <div className="ambulance-field">
              <label>
                <MapPin size={16} />
                Destination Thana
              </label>

              <select
                value={destinationThana}
                onChange={(e) => setDestinationThana(e.target.value)}
              >
                <option value="">Select Thana</option>

                {destinationThanas.map((thana) => (
                  <option key={thana} value={thana}>
                    {thana}
                  </option>
                ))}
              </select>
            </div>

            <div className="ambulance-field">
              <label>
                <MapPin size={16} />
                Destination Address
              </label>

              <input
                type="text"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                placeholder="Enter destination address"
              />
            </div>

            <div className="ambulance-field">
              <label>
                <Phone size={16} />
                Emergency Contact Number
              </label>

              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="01XXXXXXXXX"
                maxLength={11}
              />
            </div>

            {message && (
              <div className="ambulance-message">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="ambulance-btn"
              disabled={loading}
            >
              <Ambulance size={18} />

              {loading ? "BOOKING..." : "BOOK AMBULANCE NOW"}
            </button>
          </form>
        </div>

        <div className="ambulance-image-box">
          <div className="emergency-badge">24/7 AVAILABLE</div>

          <img
            src={ambulanceOne}
            className="ambulance-img-one"
            alt="RideRent Ambulance"
          />

          <img
            src={ambulanceTwo}
            className="ambulance-img-two"
            alt="RideRent Ambulance"
          />
        </div>
      </div>
    </section>
  );
}

export default AmbulanceSection;
