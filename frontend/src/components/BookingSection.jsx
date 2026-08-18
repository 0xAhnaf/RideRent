import {
  MapPin,
  Car,
  CalendarDays,
  Clock,
  BriefcaseBusiness,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import {
  cars,
  formatCarPrice,
  getCarQuantity,
  getCarStartingPrice,
} from "../data/cars";
import { locations } from "../data/locations";
import "../styles/booking.css";

function BookingSection() {
  const location = useLocation();

  const [pickupDistrict, setPickupDistrict] = useState("");
  const [pickupThana, setPickupThana] = useState("");
  const [pickupThanas, setPickupThanas] = useState([]);

  const [pickupAddress, setPickupAddress] = useState("");

  const [destinationDistrict, setDestinationDistrict] = useState("");
  const [destinationThana, setDestinationThana] = useState("");
  const [destinationThanas, setDestinationThanas] = useState([]);

  const [destinationAddress, setDestinationAddress] = useState("");

  const [selectedCar, setSelectedCar] = useState("");

  const [tripType, setTripType] = useState("One Way");
  const [tripDatetime, setTripDatetime] = useState("");
  const [tripDuration, setTripDuration] = useState("1 Day");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minTripDatetime = new Date(
    Date.now() - new Date().getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);

  const allDistricts = Object.values(locations).flatMap((division) =>
    Object.keys(division),
  );

  const selectedCarData = useMemo(
    () => cars.find((car) => car.name === selectedCar) || null,
    [selectedCar],
  );

  useEffect(() => {
    const requestedCar = location.state?.selectedCar;

    if (!requestedCar) {
      return;
    }

    const carExists = cars.some((car) => car.name === requestedCar);

    if (carExists) {
      setSelectedCar(requestedCar);
      setError("");
      setSuccess("");
    }
  }, [location.state]);

  const getThanas = (district) => {
    let thanas = [];

    Object.values(locations).forEach((division) => {
      if (division[district]) {
        thanas = division[district];
      }
    });

    return thanas;
  };

  const handleBooking = async () => {
    setError("");
    setSuccess("");

    // -----------------------------
    // FRONTEND VALIDATION
    // -----------------------------

    if (!pickupDistrict) {
      setError("Please select your pick-up district.");
      return;
    }

    if (!pickupThana) {
      setError("Please select your pick-up thana.");
      return;
    }

    if (!pickupAddress.trim()) {
      setError("Please enter your pick-up address.");
      return;
    }

    if (!destinationDistrict) {
      setError("Please select your destination district.");
      return;
    }

    if (!destinationThana) {
      setError("Please select your destination thana.");
      return;
    }

    if (!destinationAddress.trim()) {
      setError("Please enter your destination address.");
      return;
    }

    if (!selectedCarData) {
      setError("Please select a car.");
      return;
    }

    if (getCarQuantity(selectedCarData) < 1) {
      setError(
        "This car is currently unavailable. Please select another car.",
      );
      return;
    }

    if (!tripDatetime) {
      setError("Please select the trip date and time.");
      return;
    }

    if (tripDatetime < minTripDatetime) {
      setError("Please select a current or future trip date and time.");
      return;
    }

    // -----------------------------
    // CONSTRUCT DATABASE VALUES
    // -----------------------------

    const pickup = `${pickupAddress.trim()},${pickupThana},${pickupDistrict}`;

    const destination = `${destinationAddress.trim()},${destinationThana},${destinationDistrict}`;

    /*
     * For now, u_id = 1 is being used as a test user.
     *
     * Once your authentication/user system is connected,
     * this should come from the logged-in user's ID.
     */
    const bookingData = {
       u_id: 1,
       car_name: selectedCarData.name,
       trip_type: tripType,
       trip_datetime: tripDatetime,
       trip_duration: tripDuration,
       pickup: pickup,
       destination: destination,
    };

    console.log("Sending booking:", bookingData);

    // -----------------------------
    // SEND TO LARAVEL
    // -----------------------------

    try {
      setIsSubmitting(true);

      const response = await fetch(
        "http://127.0.0.1:8000/api/bookings",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify(bookingData),
        },
      );

      const responseText = await response.text();

      console.log("Laravel status:", response.status);
      console.log("Laravel response:", responseText);

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        data = {
          message: responseText,
        };
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Laravel returned HTTP ${response.status}`,
        );
      }

      setSuccess("Your booking has been saved successfully!");

      setPickupDistrict("");
      setPickupThana("");
      setPickupThanas([]);
      setPickupAddress("");

      setDestinationDistrict("");
      setDestinationThana("");
      setDestinationThanas([]);
      setDestinationAddress("");

      setSelectedCar("");
      setTripType("One Way");
      setTripDatetime("");
      setTripDuration("1 Day");

      console.log("Booking saved:", data);
    } catch (error) {
      console.error("Booking error:", error);

      setError(
        error.message ||
          "Unable to save your booking. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="booking-section">
      <div className="booking-card-wrapper">
        <h2>Book Your Trip</h2>

        <div className="booking-form">

          {/* PICKUP DISTRICT */}
          <div className="form-group">
            <label htmlFor="pickup-district">
              <MapPin size={16} />
              Select Pick-Up District
            </label>

            <select
              id="pickup-district"
              value={pickupDistrict}
              onChange={(event) => {
                const district = event.target.value;

                setPickupDistrict(district);
                setPickupThana("");
                setPickupThanas(getThanas(district));
              }}
            >
              <option value="">Select District</option>

              {allDistricts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>

          {/* PICKUP THANA */}
          <div className="form-group">
            <label htmlFor="pickup-thana">
              <MapPin size={16} />
              Select Pick-Up Thana
            </label>

            <select
              id="pickup-thana"
              value={pickupThana}
              onChange={(event) =>
                setPickupThana(event.target.value)
              }
            >
              <option value="">Select Thana</option>

              {pickupThanas.map((thana) => (
                <option key={thana} value={thana}>
                  {thana}
                </option>
              ))}
            </select>
          </div>

          {/* PICKUP ADDRESS */}
          <div className="form-group">
            <label htmlFor="pickup-address">
              <MapPin size={16} />
              Write Your Pick-Up Address
            </label>

            <input
              id="pickup-address"
              type="text"
              value={pickupAddress}
              onChange={(event) =>
                setPickupAddress(event.target.value)
              }
            />
          </div>

          {/* DESTINATION DISTRICT */}
          <div className="form-group">
            <label htmlFor="destination-district">
              <MapPin size={16} />
              Select Destination District
            </label>

            <select
              id="destination-district"
              value={destinationDistrict}
              onChange={(event) => {
                const district = event.target.value;

                setDestinationDistrict(district);
                setDestinationThana("");
                setDestinationThanas(getThanas(district));
              }}
            >
              <option value="">Select District</option>

              {allDistricts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>

          {/* DESTINATION THANA */}
          <div className="form-group">
            <label htmlFor="destination-thana">
              <MapPin size={16} />
              Select Destination Thana
            </label>

            <select
              id="destination-thana"
              value={destinationThana}
              onChange={(event) =>
                setDestinationThana(event.target.value)
              }
            >
              <option value="">Select Thana</option>

              {destinationThanas.map((thana) => (
                <option key={thana} value={thana}>
                  {thana}
                </option>
              ))}
            </select>
          </div>

          {/* DESTINATION ADDRESS */}
          <div className="form-group">
            <label htmlFor="destination-address">
              <MapPin size={16} />
              Write Your Destination Address
            </label>

            <input
              id="destination-address"
              type="text"
              value={destinationAddress}
              onChange={(event) =>
                setDestinationAddress(event.target.value)
              }
            />
          </div>

          {/* CAR */}
          <div className="form-group">
            <label htmlFor="booking-car">
              <Car size={16} />
              Select Car
            </label>

            <select
              id="booking-car"
              value={selectedCar}
              onChange={(event) => {
                setSelectedCar(event.target.value);

                setError("");
                setSuccess("");
              }}
            >
              <option value="">Select Car - Model</option>

              {cars.map((car) => {
                const quantity = getCarQuantity(car);

                return (
                  <option
                    key={car.id}
                    value={car.name}
                    disabled={quantity < 1}
                  >
                    {car.name} - {car.seats} Seat -{" "}
                    {formatCarPrice(
                      getCarStartingPrice(car),
                    )}
                    /day - {quantity}{" "}
                    {quantity === 1 ? "Car" : "Cars"} Available
                  </option>
                );
              })}
            </select>

            {selectedCarData && (
              <p
                className={`booking-availability-message ${
                  getCarQuantity(selectedCarData) === 1
                    ? "is-limited"
                    : ""
                }`}
              >
                {getCarQuantity(selectedCarData) === 1
                  ? `Only 1 car of this model is currently listed. Starting body rent: ${formatCarPrice(
                      getCarStartingPrice(selectedCarData),
                    )}/day for 1 day.`
                  : `${getCarQuantity(
                      selectedCarData,
                    )} cars of this model are currently listed. Starting body rent: ${formatCarPrice(
                      getCarStartingPrice(selectedCarData),
                    )}/day for 1 day.`}
              </p>
            )}
          </div>

          {/* TRIP TYPE */}
          <div className="form-group">
            <label htmlFor="trip-type">
              <BriefcaseBusiness size={16} />
              Trip Type
            </label>

            <select
              id="trip-type"
              value={tripType}
              onChange={(event) =>
                setTripType(event.target.value)
              }
            >
              <option value="One Way">One Way</option>
              <option value="Round Trip">Round Trip</option>
            </select>
          </div>

          {/* DATE & TIME */}
          <div className="form-group">
            <label htmlFor="trip-date-time">
              <CalendarDays size={16} />
              Trip Date &amp; Time
            </label>

            <input
              id="trip-date-time"
              type="datetime-local"
              min={minTripDatetime}
              value={tripDatetime}
              onChange={(event) =>
                setTripDatetime(event.target.value)
              }
            />
          </div>

          {/* TRIP DURATION */}
          <div className="form-group">
            <label htmlFor="trip-duration">
              <Clock size={16} />
              Trip Duration
            </label>

            <select
              id="trip-duration"
              value={tripDuration}
              onChange={(event) =>
                setTripDuration(event.target.value)
              }
            >
              <option value="1 Day">1 Day</option>
              <option value="2 Days">2 Days</option>
              <option value="3 Days">3 Days</option>
              <option value="More Than 3 Days">
                More Than 3 Days
              </option>
            </select>
          </div>

          {error && (
            <p className="booking-error">
              {error}
            </p>
          )}

          {success && (
            <p className="booking-success">
              {success}
            </p>
          )}

          <button
            type="button"
            className="book-now-btn"
            onClick={handleBooking}
            disabled={isSubmitting}
          >
            {isSubmitting ? "SAVING..." : "FIND RENT"}
          </button>

        </div>
      </div>
    </section>
  );
}

export default BookingSection;