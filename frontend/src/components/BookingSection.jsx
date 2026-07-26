import {
  MapPin,
  Car,
  CalendarDays,
  Clock,
  Mail,
  Phone,
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

  const [pickupDistrict, setPickupDistrict] =
    useState("");
  const [pickupThanas, setPickupThanas] =
    useState([]);

  const [
    destinationDistrict,
    setDestinationDistrict,
  ] = useState("");
  const [
    destinationThanas,
    setDestinationThanas,
  ] = useState([]);

  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [selectedCar, setSelectedCar] =
    useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const allDistricts = Object.values(locations).flatMap(
    (division) => Object.keys(division)
  );

  const selectedCarData = useMemo(
    () =>
      cars.find(
        (car) => car.name === selectedCar
      ) || null,
    [selectedCar]
  );

  useEffect(() => {
    const requestedCar =
      location.state?.selectedCar;

    if (!requestedCar) {
      return;
    }

    const carExists = cars.some(
      (car) => car.name === requestedCar
    );

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

  const handleBooking = () => {
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const mobilePattern =
      /^01[3-9]\d{8}$/;

    if (!email) {
      setError(
        "Please enter your email address"
      );
      setSuccess("");
      return;
    }

    if (!emailPattern.test(email)) {
      setError(
        "Please enter a valid email address"
      );
      setSuccess("");
      return;
    }

    if (!mobile) {
      setError(
        "Please enter your mobile number"
      );
      setSuccess("");
      return;
    }

    if (!mobilePattern.test(mobile)) {
      setError(
        "Please enter a valid Bangladesh mobile number"
      );
      setSuccess("");
      return;
    }

    if (!selectedCarData) {
      setError("Please select a car");
      setSuccess("");
      return;
    }

    if (getCarQuantity(selectedCarData) < 1) {
      setError(
        "This car is currently unavailable. Please select another car."
      );
      setSuccess("");
      return;
    }

    setError("");

    setSuccess(
      "Your booking request has been submitted successfully!"
    );
  };

  return (
    <section className="booking-section">
      <div className="booking-card-wrapper">
        <h2>Book Your Trip</h2>

        <div className="booking-form">
          <div className="form-group">
            <label htmlFor="pickup-district">
              <MapPin size={16} />
              Select Pick-Up District
            </label>

            <select
              id="pickup-district"
              value={pickupDistrict}
              onChange={(event) => {
                const district =
                  event.target.value;

                setPickupDistrict(district);

                setPickupThanas(
                  getThanas(district)
                );
              }}
            >
              <option value="">
                Select District
              </option>

              {allDistricts.map((district) => (
                <option
                  key={district}
                  value={district}
                >
                  {district}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="pickup-thana">
              <MapPin size={16} />
              Select Pick-Up Thana
            </label>

            <select
              id="pickup-thana"
              defaultValue=""
            >
              <option value="">
                Select Thana
              </option>

              {pickupThanas.map((thana) => (
                <option
                  key={thana}
                  value={thana}
                >
                  {thana}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="pickup-address">
              <MapPin size={16} />
              Write Your Pick-Up Address
            </label>

            <input
              id="pickup-address"
              type="text"
            />
          </div>

          <div className="form-group">
            <label htmlFor="destination-district">
              <MapPin size={16} />
              Select Destination District
            </label>

            <select
              id="destination-district"
              value={destinationDistrict}
              onChange={(event) => {
                const district =
                  event.target.value;

                setDestinationDistrict(district);

                setDestinationThanas(
                  getThanas(district)
                );
              }}
            >
              <option value="">
                Select District
              </option>

              {allDistricts.map((district) => (
                <option
                  key={district}
                  value={district}
                >
                  {district}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="destination-thana">
              <MapPin size={16} />
              Select Destination Thana
            </label>

            <select
              id="destination-thana"
              defaultValue=""
            >
              <option value="">
                Select Thana
              </option>

              {destinationThanas.map(
                (thana) => (
                  <option
                    key={thana}
                    value={thana}
                  >
                    {thana}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="destination-address">
              <MapPin size={16} />
              Write Your Destination Address
            </label>

            <input
              id="destination-address"
              type="text"
            />
          </div>

          <div className="form-group">
            <label htmlFor="booking-car">
              <Car size={16} />
              Select Car
            </label>

            <select
              id="booking-car"
              value={selectedCar}
              onChange={(event) => {
                setSelectedCar(
                  event.target.value
                );

                setError("");
                setSuccess("");
              }}
            >
              <option value="">
                Select Car - Model
              </option>

              {cars.map((car) => {
                const quantity =
                  getCarQuantity(car);

                return (
                  <option
                    key={car.id}
                    value={car.name}
                    disabled={quantity < 1}
                  >
                    {car.name} - {car.seats} Seat
                    - {formatCarPrice(
                      getCarStartingPrice(car)
                    )}/day - {quantity}{" "}
                    {quantity === 1
                      ? "Car"
                      : "Cars"}{" "}
                    Available
                  </option>
                );
              })}
            </select>

            {selectedCarData && (
              <p
                className={`booking-availability-message ${
                  getCarQuantity(
                    selectedCarData
                  ) === 1
                    ? "is-limited"
                    : ""
                }`}
              >
                {getCarQuantity(
                  selectedCarData
                ) === 1
                  ? `Only 1 car of this model is currently listed. Starting body rent: ${formatCarPrice(
                      getCarStartingPrice(
                        selectedCarData
                      )
                    )}/day for 1 day.`
                  : `${getCarQuantity(
                      selectedCarData
                    )} cars of this model are currently listed. Starting body rent: ${formatCarPrice(
                      getCarStartingPrice(
                        selectedCarData
                      )
                    )}/day for 1 day.`}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="trip-type">
              <BriefcaseBusiness size={16} />
              Trip Type
            </label>

            <select
              id="trip-type"
              defaultValue="One Way"
            >
              <option value="One Way">
                One Way
              </option>

              <option value="Round Trip">
                Round Trip
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="trip-date-time">
              <CalendarDays size={16} />
              Trip Date &amp; Time
            </label>

            <input
              id="trip-date-time"
              type="datetime-local"
            />
          </div>

          <div className="form-group">
            <label htmlFor="trip-duration">
              <Clock size={16} />
              Trip Duration
            </label>

            <select
              id="trip-duration"
              defaultValue="1 Day"
            >
              <option value="1 Day">
                1 Day
              </option>

              <option value="2 Days">
                2 Days
              </option>

              <option value="3 Days">
                3 Days
              </option>

              <option value="More Than 3 Days">
                More Than 3 Days
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="booking-email">
              <Mail size={16} />
              Your Email Address (Important)
            </label>

            <input
              id="booking-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="example@gmail.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="booking-mobile">
              <Phone size={16} />
              Your Mobile Number
            </label>

            <input
              id="booking-mobile"
              type="text"
              value={mobile}
              onChange={(event) =>
                setMobile(event.target.value)
              }
              placeholder="01XXXXXXXXX"
            />
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
          >
            FIND RENT
          </button>
        </div>
      </div>
    </section>
  );
}

export default BookingSection;