import { useEffect, useState } from "react";

import { apiFetch } from "../../api";
import "../../styles/relationship-reports-section.css";

const emptyReports = {
  booking_vehicle_records: [],
  fleet_booking_coverage: [],
  driver_booking_coverage: [],
  complete_assignment_review: [],
};

const formatDate = (value) => {
  if (!value) {
    return "Not scheduled";
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

const StatusBadge = ({ value, fallback = "Not assigned" }) => {
  const label = value || fallback;
  const className = String(label).toLowerCase().replace(/\s+/g, "-");

  return (
    <span className={`relationship-status status-${className}`}>
      {label}
    </span>
  );
};

const EmptyTableRow = ({ columns, message }) => (
  <tr>
    <td className="relationship-empty-cell" colSpan={columns}>
      {message}
    </td>
  </tr>
);

function RelationshipReportsSection() {
  const [reports, setReports] = useState(emptyReports);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadReports = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiFetch("/api/reports/relationships", {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.message || "Unable to load detailed reports.");
        }

        setReports({
          booking_vehicle_records: Array.isArray(result.booking_vehicle_records)
            ? result.booking_vehicle_records
            : [],
          fleet_booking_coverage: Array.isArray(result.fleet_booking_coverage)
            ? result.fleet_booking_coverage
            : [],
          driver_booking_coverage: Array.isArray(result.driver_booking_coverage)
            ? result.driver_booking_coverage
            : [],
          complete_assignment_review: Array.isArray(
            result.complete_assignment_review,
          )
            ? result.complete_assignment_review
            : [],
        });
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          console.error("Error loading detailed reports:", requestError);
          setError(requestError.message || "Unable to load detailed reports.");
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
      <section className="relationship-report-state" role="status">
        <span className="relationship-report-spinner" />
        <p>Loading operational records...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="relationship-report-state error" role="alert">
        {error}
      </section>
    );
  }

  return (
    <section className="relationship-report-section" aria-labelledby="record-review-title">
      <div className="relationship-report-heading">
        <div>
          <span>RECORD REVIEW</span>
          <h3 id="record-review-title">Operational Details</h3>
        </div>
        <p>Review vehicle usage, driver activity, and booking assignments.</p>
      </div>

      <div className="relationship-report-grid">
        <article className="relationship-report-card wide-card">
          <header>
            <div>
              <span>TRIP RECORDS</span>
              <h4>Booking &amp; Vehicle Details</h4>
            </div>
            <p>Vehicles connected with their recorded bookings.</p>
          </header>

          <div className="relationship-table-wrapper">
            <table className="relationship-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Vehicle</th>
                  <th>Category</th>
                  <th>Journey</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reports.booking_vehicle_records.length === 0 ? (
                  <EmptyTableRow columns={5} message="No booking records found." />
                ) : (
                  reports.booking_vehicle_records.map((record) => (
                    <tr key={`vehicle-booking-${record.booking_id}`}>
                      <td>
                        <strong>BK-{record.booking_id}</strong>
                        <small>{record.trip_type}</small>
                      </td>
                      <td>
                        <strong>{record.vehicle_name}</strong>
                        <small>{record.vehicle_brand}</small>
                      </td>
                      <td>{record.vehicle_category}</td>
                      <td className="relationship-journey-cell">
                        <span>{record.pickup}</span>
                        <small>to {record.destination}</small>
                      </td>
                      <td>
                        <StatusBadge value={record.booking_status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="relationship-report-card">
          <header>
            <div>
              <span>FLEET ACTIVITY</span>
              <h4>Fleet Booking Coverage</h4>
            </div>
            <p>Every vehicle, including models without bookings.</p>
          </header>

          <div className="relationship-table-wrapper compact-table-wrapper">
            <table className="relationship-table compact-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Booking</th>
                  <th>Booking Status</th>
                </tr>
              </thead>
              <tbody>
                {reports.fleet_booking_coverage.length === 0 ? (
                  <EmptyTableRow columns={3} message="No vehicle records found." />
                ) : (
                  reports.fleet_booking_coverage.map((record, index) => (
                    <tr key={`fleet-${record.vehicle_id}-${record.booking_id ?? index}`}>
                      <td>
                        <strong>{record.vehicle_name}</strong>
                        <small>{record.vehicle_brand}</small>
                      </td>
                      <td>
                        {record.booking_id ? (
                          <>
                            <strong>BK-{record.booking_id}</strong>
                            <small>{formatDate(record.trip_datetime)}</small>
                          </>
                        ) : (
                          <span className="relationship-muted">No booking yet</span>
                        )}
                      </td>
                      <td>
                        <StatusBadge
                          value={record.booking_status}
                          fallback="No booking"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="relationship-report-card">
          <header>
            <div>
              <span>DRIVER ACTIVITY</span>
              <h4>Driver Booking Coverage</h4>
            </div>
            <p>Every driver, including drivers without bookings.</p>
          </header>

          <div className="relationship-table-wrapper compact-table-wrapper">
            <table className="relationship-table compact-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Availability</th>
                  <th>Booking</th>
                </tr>
              </thead>
              <tbody>
                {reports.driver_booking_coverage.length === 0 ? (
                  <EmptyTableRow columns={3} message="No driver records found." />
                ) : (
                  reports.driver_booking_coverage.map((record, index) => (
                    <tr key={`driver-${record.driver_id}-${record.booking_id ?? index}`}>
                      <td>
                        <strong>{record.driver_name}</strong>
                        <small>{record.driver_phone}</small>
                      </td>
                      <td>
                        <StatusBadge value={record.driver_status} />
                      </td>
                      <td>
                        {record.booking_id ? (
                          <>
                            <strong>BK-{record.booking_id}</strong>
                            <small>{record.booking_status}</small>
                          </>
                        ) : (
                          <span className="relationship-muted">No booking assigned</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="relationship-report-card wide-card">
          <header>
            <div>
              <span>ASSIGNMENT MONITORING</span>
              <h4>Complete Assignment Review</h4>
            </div>
            <p>Matched and unmatched driver-booking records in one view.</p>
          </header>

          <div className="relationship-table-wrapper">
            <table className="relationship-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Driver Status</th>
                  <th>Booking</th>
                  <th>Trip Schedule</th>
                  <th>Booking Status</th>
                </tr>
              </thead>
              <tbody>
                {reports.complete_assignment_review.length === 0 ? (
                  <EmptyTableRow columns={5} message="No assignment records found." />
                ) : (
                  reports.complete_assignment_review.map((record, index) => (
                    <tr
                      key={`assignment-${record.driver_id ?? "none"}-${
                        record.booking_id ?? "none"
                      }-${index}`}
                    >
                      <td>
                        {record.driver_name ? (
                          <strong>{record.driver_name}</strong>
                        ) : (
                          <span className="relationship-warning">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <StatusBadge
                          value={record.driver_status}
                          fallback="No driver"
                        />
                      </td>
                      <td>
                        {record.booking_id ? (
                          <strong>BK-{record.booking_id}</strong>
                        ) : (
                          <span className="relationship-muted">No booking</span>
                        )}
                      </td>
                      <td>{formatDate(record.trip_datetime)}</td>
                      <td>
                        <StatusBadge
                          value={record.booking_status}
                          fallback="No booking"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}

export default RelationshipReportsSection;
