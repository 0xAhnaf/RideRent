import { useEffect, useState } from "react";
import { CalendarClock, Car, UsersRound } from "lucide-react";

import { apiFetch } from "../../api";
import "../../styles/business-insights-section.css";

const emptyInsights = {
  customer_favorite_vehicle: null,
  latest_completed_journey: null,
  experienced_driver_spotlight: null,
};

const formatNumber = (value) => Number(value || 0).toLocaleString("en-BD");

const formatCurrency = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) {
    return "Schedule unavailable";
  }

  const parsedDate = new Date(String(value).replace(" ", "T"));

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const StatusBadge = ({ value }) => {
  const label = value || "Unavailable";
  const statusClass = String(label).toLowerCase().replace(/\s+/g, "-");

  return (
    <span className={`business-insight-status status-${statusClass}`}>
      {label}
    </span>
  );
};

const EmptyInsight = ({ message }) => (
  <div className="business-insight-empty">
    <p>{message}</p>
  </div>
);

function BusinessInsightsSection() {
  const [insights, setInsights] = useState(emptyInsights);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadInsights = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiFetch("/api/reports/business-insights", {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.message || "Unable to load business insights.");
        }

        setInsights({
          customer_favorite_vehicle:
            result.customer_favorite_vehicle || null,
          latest_completed_journey:
            result.latest_completed_journey || null,
          experienced_driver_spotlight:
            result.experienced_driver_spotlight || null,
        });
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          console.error("Error loading business insights:", requestError);
          setError(requestError.message || "Unable to load business insights.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadInsights();

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <section className="business-insight-state" role="status">
        <span className="business-insight-spinner" />
        <p>Loading business highlights...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="business-insight-state error" role="alert">
        {error}
      </section>
    );
  }

  const favoriteVehicle = insights.customer_favorite_vehicle;
  const latestJourney = insights.latest_completed_journey;
  const experiencedDriver = insights.experienced_driver_spotlight;

  return (
    <section
      className="business-insights-section"
      aria-labelledby="business-insights-title"
    >
      <div className="business-insights-heading">
        <div>
          <span>PERFORMANCE INSIGHTS</span>
          <h3 id="business-insights-title">Business Highlights</h3>
        </div>
        <p>Focused insights from customer demand, journeys, and driver records.</p>
      </div>

      <div className="business-insights-grid">
        <article className="business-insight-card">
          <header>
            <div className="business-insight-icon">
              <Car size={21} aria-hidden="true" />
            </div>
            <div>
              <span>CUSTOMER DEMAND</span>
              <h4>Customer Favorite Vehicle</h4>
            </div>
          </header>

          {favoriteVehicle ? (
            <div className="business-insight-body">
              <div className="business-insight-title-row">
                <div>
                  <strong>{favoriteVehicle.vehicle_name}</strong>
                  <small>
                    {favoriteVehicle.vehicle_brand} · {favoriteVehicle.vehicle_category}
                  </small>
                </div>
                <StatusBadge value={favoriteVehicle.vehicle_status} />
              </div>

              <div className="business-insight-metrics">
                <div>
                  <span>Recorded Bookings</span>
                  <strong>{formatNumber(favoriteVehicle.booking_count)}</strong>
                </div>
                <div>
                  <span>Rental Price</span>
                  <strong>{formatCurrency(favoriteVehicle.price)}</strong>
                </div>
                <div>
                  <span>Seats</span>
                  <strong>{formatNumber(favoriteVehicle.seats)}</strong>
                </div>
              </div>
            </div>
          ) : (
            <EmptyInsight message="No vehicle booking data is available yet." />
          )}
        </article>

        <article className="business-insight-card">
          <header>
            <div className="business-insight-icon">
              <UsersRound size={21} aria-hidden="true" />
            </div>
            <div>
              <span>DRIVER READINESS</span>
              <h4>Experienced Driver Spotlight</h4>
            </div>
          </header>

          {experiencedDriver ? (
            <div className="business-insight-body">
              <div className="business-insight-title-row">
                <div>
                  <strong>{experiencedDriver.driver_name}</strong>
                  <small>{experiencedDriver.phone}</small>
                </div>
                <StatusBadge value={experiencedDriver.driver_status} />
              </div>

              <div className="business-insight-metrics">
                <div>
                  <span>Experience</span>
                  <strong>
                    {formatNumber(experiencedDriver.experience_years)} years
                  </strong>
                </div>
                <div>
                  <span>Assignments</span>
                  <strong>{formatNumber(experiencedDriver.assignment_count)}</strong>
                </div>
                <div>
                  <span>Completed</span>
                  <strong>
                    {formatNumber(experiencedDriver.completed_assignments)}
                  </strong>
                </div>
              </div>

              <p className="business-insight-note">
                License: {experiencedDriver.license_number}
              </p>
            </div>
          ) : (
            <EmptyInsight message="No available driver is ready for spotlight." />
          )}
        </article>

        <article className="business-insight-card journey-card">
          <header>
            <div className="business-insight-icon">
              <CalendarClock size={21} aria-hidden="true" />
            </div>
            <div>
              <span>COMPLETED JOURNEY</span>
              <h4>Latest Completed Journey</h4>
            </div>
          </header>

          {latestJourney ? (
            <div className="business-insight-body journey-body">
              <div className="business-insight-title-row">
                <div>
                  <strong>BK-{latestJourney.booking_id}</strong>
                  <small>{formatDate(latestJourney.trip_datetime)}</small>
                </div>
                <StatusBadge value={latestJourney.booking_status} />
              </div>

              <div className="business-journey-route">
                <div>
                  <span>Pickup</span>
                  <strong>{latestJourney.pickup}</strong>
                </div>
                <span className="business-journey-line" aria-hidden="true" />
                <div>
                  <span>Destination</span>
                  <strong>{latestJourney.destination}</strong>
                </div>
              </div>

              <div className="business-journey-details">
                <div>
                  <span>Vehicle</span>
                  <strong>{latestJourney.vehicle_name || "Vehicle unavailable"}</strong>
                  <small>{latestJourney.vehicle_brand || "Brand unavailable"}</small>
                </div>
                <div>
                  <span>Driver</span>
                  <strong>{latestJourney.driver_name || "Not assigned"}</strong>
                  <small>{latestJourney.driver_id ? `Driver #${latestJourney.driver_id}` : "No driver record"}</small>
                </div>
                <div>
                  <span>Trip</span>
                  <strong>{latestJourney.trip_type}</strong>
                  <small>{latestJourney.trip_duration}</small>
                </div>
              </div>
            </div>
          ) : (
            <EmptyInsight message="No completed journey has been recorded yet." />
          )}
        </article>
      </div>
    </section>
  );
}

export default BusinessInsightsSection;
