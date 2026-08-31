import { useEffect, useState } from "react";
import { Car, Gauge, UsersRound } from "lucide-react";

import "../../styles/fleet-opportunities-section.css";

const API_URL = "http://127.0.0.1:8000/api/reports/fleet-opportunities";

const emptyReports = {
  active_demand_fleet: [],
  higher_capacity_alternatives: [],
  maximum_capacity_fleet: [],
};

const formatNumber = (value) => Number(value || 0).toLocaleString("en-BD");

const formatCurrency = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const StatusBadge = ({ value }) => {
  const label = value || "Unavailable";
  const statusClass = String(label).toLowerCase().replace(/\s+/g, "-");

  return (
    <span className={`fleet-opportunity-status status-${statusClass}`}>
      {label}
    </span>
  );
};

const EmptyTableRow = ({ message, columns = 5 }) => (
  <tr>
    <td className="fleet-opportunity-empty-cell" colSpan={columns}>
      {message}
    </td>
  </tr>
);

const VehicleIdentity = ({ vehicle }) => (
  <>
    <strong>{vehicle.vehicle_name}</strong>
    <small>{vehicle.vehicle_brand}</small>
  </>
);

function FleetOpportunitiesSection() {
  const [reports, setReports] = useState(emptyReports);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadReports = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.message || "Unable to load fleet opportunities.");
        }

        setReports({
          active_demand_fleet: Array.isArray(result.active_demand_fleet)
            ? result.active_demand_fleet
            : [],
          higher_capacity_alternatives: Array.isArray(
            result.higher_capacity_alternatives,
          )
            ? result.higher_capacity_alternatives
            : [],
          maximum_capacity_fleet: Array.isArray(result.maximum_capacity_fleet)
            ? result.maximum_capacity_fleet
            : [],
        });
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          console.error("Error loading fleet opportunities:", requestError);
          setError(requestError.message || "Unable to load fleet opportunities.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadReports();

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <section className="fleet-opportunity-state" role="status">
        <span className="fleet-opportunity-spinner" />
        <p>Loading fleet planning data...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="fleet-opportunity-state error" role="alert">
        {error}
      </section>
    );
  }

  return (
    <section
      className="fleet-opportunities-section"
      aria-labelledby="fleet-opportunities-title"
    >
      <div className="fleet-opportunities-heading">
        <div>
          <span>FLEET PLANNING</span>
          <h3 id="fleet-opportunities-title">Fleet Opportunities</h3>
        </div>
        <p>Review active demand, capacity upgrades, and group-ready vehicles.</p>
      </div>

      <div className="fleet-opportunities-grid">
        <article className="fleet-opportunity-card wide-card">
          <header>
            <div className="fleet-opportunity-icon">
              <Car size={21} aria-hidden="true" />
            </div>
            <div>
              <span>CURRENT DEMAND</span>
              <h4>Active-Demand Fleet</h4>
            </div>
            <p>Vehicles connected to pending or confirmed bookings.</p>
          </header>

          <div className="fleet-opportunity-table-wrapper">
            <table className="fleet-opportunity-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Category</th>
                  <th>Seats</th>
                  <th>Active Bookings</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reports.active_demand_fleet.length === 0 ? (
                  <EmptyTableRow message="No active vehicle demand was found." />
                ) : (
                  reports.active_demand_fleet.map((vehicle) => (
                    <tr key={`active-demand-${vehicle.vehicle_id}`}>
                      <td>
                        <VehicleIdentity vehicle={vehicle} />
                      </td>
                      <td>{vehicle.vehicle_category}</td>
                      <td>{formatNumber(vehicle.seats)}</td>
                      <td>
                        <strong>{formatNumber(vehicle.active_booking_count)}</strong>
                      </td>
                      <td>
                        <StatusBadge value={vehicle.vehicle_status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="fleet-opportunity-card">
          <header>
            <div className="fleet-opportunity-icon">
              <UsersRound size={21} aria-hidden="true" />
            </div>
            <div>
              <span>UPGRADE OPTIONS</span>
              <h4>Higher-Capacity Alternatives</h4>
            </div>
          </header>

          <div className="fleet-opportunity-list">
            {reports.higher_capacity_alternatives.length === 0 ? (
              <div className="fleet-opportunity-empty">
                No larger available alternative matches current demand.
              </div>
            ) : (
              reports.higher_capacity_alternatives.map((vehicle) => (
                <div
                  className="fleet-opportunity-list-item"
                  key={`capacity-alternative-${vehicle.vehicle_id}`}
                >
                  <div>
                    <VehicleIdentity vehicle={vehicle} />
                  </div>
                  <div className="fleet-opportunity-list-metrics">
                    <span>{formatNumber(vehicle.seats)} seats</span>
                    <strong>{formatCurrency(vehicle.price)}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="fleet-opportunity-card">
          <header>
            <div className="fleet-opportunity-icon">
              <Gauge size={21} aria-hidden="true" />
            </div>
            <div>
              <span>GROUP TRAVEL</span>
              <h4>Maximum-Capacity Fleet</h4>
            </div>
          </header>

          <div className="fleet-opportunity-list">
            {reports.maximum_capacity_fleet.length === 0 ? (
              <div className="fleet-opportunity-empty">
                No available maximum-capacity vehicle was found.
              </div>
            ) : (
              reports.maximum_capacity_fleet.map((vehicle) => (
                <div
                  className="fleet-opportunity-list-item"
                  key={`maximum-capacity-${vehicle.vehicle_id}`}
                >
                  <div>
                    <VehicleIdentity vehicle={vehicle} />
                    <small>{vehicle.vehicle_category}</small>
                  </div>
                  <div className="fleet-opportunity-list-metrics">
                    <span>{formatNumber(vehicle.seats)} seats</span>
                    <strong>{formatNumber(vehicle.quantity)} units</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

export default FleetOpportunitiesSection;
