import { useEffect, useState } from "react";
import { Check, Flag, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getCsrfCookie } from "../api";
import AdminHeader from "../components/admin/AdminHeader";
import AdminSidebar from "../components/admin/AdminSidebar";
import { ambulanceRequest } from "../components/admin/ambulance/ambulanceApi";
import "../styles/admin-dashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [ambulanceBookings, setAmbulanceBookings] = useState(null);
  const [ambulanceError, setAmbulanceError] = useState("");
  const [stats, setStats] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    ambulanceRequest("/bookings", { signal: controller.signal })
      .then((data) => setAmbulanceBookings(data.bookings))
      .catch((error) => {
        if (error.name !== "AbortError") setAmbulanceError(error.message);
      });
    return () => controller.abort();
  }, []);

  // Fetch dashboard metrics for KPI cards
  const fetchDashboard = async (signal, showLoading = true) => {
  try {
    if (showLoading) {
      setLoadingDashboard(true);
    }

    setDashboardError("");

    const response = await apiFetch("/api/admin/dashboard", { signal });

    if (!response.ok) {
      throw new Error("Failed to load dashboard metrics");
    }

    const data = await response.json();
    setStats(data.stats);
  } catch (error) {
    if (error.name !== "AbortError") {
      setDashboardError(error.message);
    }
  } finally {
    if (showLoading && !signal?.aborted) {
      setLoadingDashboard(false);
    }
  }
};

useEffect(() => {
  const controller = new AbortController();

  fetchDashboard(controller.signal);

  return () => controller.abort();
}, []);

  const pendingAmbulances = ambulanceBookings?.filter((booking) => booking.status === "pending");

  const handleNavigation = (item) => {
    setActiveNav(item.label);
    if (item.path) navigate(item.path);
  };

  // Real bookings from Laravel API
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingError, setBookingError] = useState("");

  // READ: Get all bookings from Laravel
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoadingBookings(true);
        setBookingError("");

        const response = await apiFetch("/api/bookings");

        if (!response.ok) {
          throw new Error("Failed to fetch bookings.");
        }

        const data = await response.json();

        setBookings(data);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setBookingError("Unable to load bookings.");
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookings();
  }, []);

  // DELETE: Delete booking from Laravel
  const deleteBooking = async (bookingId) => {
    try {
      await getCsrfCookie();

      const response = await apiFetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete booking.");
      }

      setBookings((currentBookings) =>
        currentBookings.filter((booking) => booking.b_id !== bookingId),
      );
      await fetchDashboard(undefined, false);
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  // UPDATE: Change booking status
  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      await getCsrfCookie();

      const response = await apiFetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          booking_status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update booking status.");
      }

      const data = await response.json();

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.b_id === bookingId ? data.booking : booking,
        ),
      );

      await fetchDashboard();
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <AdminSidebar activeItem="Dashboard" />

      {/* Main Content */}
      <main className="admin-main">
        {/* Header */}
        <AdminHeader
          title="Overview"
          subtitle="Real-time system metrics and pending actions."
        />

        {/* KPI Cards */}
        <section className="stats-grid">
          {loadingDashboard ? (
            <>
              <article className="stat-card normal"><div className="stat-top"><div className="stat-icon">♙</div></div><div><h3>Total Users</h3><p>Loading...</p></div></article>
              <article className="stat-card normal"><div className="stat-top"><div className="stat-icon">▱</div></div><div><h3>Total Vehicles</h3><p>Loading...</p></div></article>
              <article className="stat-card active"><div className="stat-top"><div className="stat-icon">▣</div></div><div><h3>Active Bookings</h3><p>Loading...</p></div></article>
              <article className="stat-card normal"><div className="stat-top"><div className="stat-icon">▰</div></div><div><h3>Available Vehicles</h3><p>Loading...</p></div></article>
              <article className="stat-card danger"><div className="stat-top"><div className="stat-icon">✚</div></div><div><h3>Pending Ambulance</h3><p>Loading...</p></div></article>
              <article className="stat-card normal"><div className="stat-top"><div className="stat-icon">৳</div></div><div><h3>Monthly Revenue</h3><p>Loading...</p></div></article>
            </>
          ) : dashboardError ? (
            <>
              <article className="stat-card normal"><div className="stat-top"><div className="stat-icon">♙</div></div><div><h3>Total Users</h3><p>Error</p></div></article>
              <article className="stat-card normal"><div className="stat-top"><div className="stat-icon">▱</div></div><div><h3>Total Vehicles</h3><p>Error</p></div></article>
              <article className="stat-card active"><div className="stat-top"><div className="stat-icon">▣</div></div><div><h3>Active Bookings</h3><p>Error</p></div></article>
              <article className="stat-card normal"><div className="stat-top"><div className="stat-icon">▰</div></div><div><h3>Available Vehicles</h3><p>Error</p></div></article>
              <article className="stat-card danger"><div className="stat-top"><div className="stat-icon">✚</div></div><div><h3>Pending Ambulance</h3><p>Error</p></div></article>
              <article className="stat-card normal"><div className="stat-top"><div className="stat-icon">৳</div></div><div><h3>Monthly Revenue</h3><p>Error</p></div></article>
            </>
          ) : (
            stats?.map((stat) => (
              <article key={stat.title} className={`stat-card ${stat.type}`}>
                <div className="stat-top"><div className="stat-icon">{stat.icon}</div></div>
                <div>
                  <h3>{stat.title}</h3>
                  <p>{stat.value}</p>
                </div>
              </article>
            ))
          )}
        </section>

        {/* Main Dashboard Grid */}
        <section className="dashboard-grid">
          {/* Recent Bookings */}
          <article className="dashboard-card bookings-card">
            <div className="card-header">
              <h3>Recent Bookings</h3>

              <button
                type="button"
                className="view-all-button"
                onClick={() => navigate("/admin/bookings")}
              >
                View All <span>→</span>
              </button>
            </div>

            <div className="table-wrapper">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {/* Loading state */}
                  {loadingBookings && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center" }}>
                        Loading bookings...
                      </td>
                    </tr>
                  )}

                  {/* Error state */}
                  {!loadingBookings && bookingError && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center" }}>
                        {bookingError}
                      </td>
                    </tr>
                  )}

                  {/* Empty state */}
                  {!loadingBookings &&
                    !bookingError &&
                    bookings.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center" }}>
                          No bookings found.
                        </td>
                      </tr>
                    )}

                  {/* Real bookings */}
                  {!loadingBookings &&
                    !bookingError &&
                    bookings.map((booking) => (
                      <tr key={booking.b_id}>
                        <td className="booking-id">#BK-{booking.b_id}</td>

                        <td>
                          <div className="customer-cell">
                            <div className="customer-avatar">
                              {String(booking.u_id).slice(-2)}
                            </div>

                            <span>User #{booking.u_id}</span>
                          </div>
                        </td>

                        <td>{booking.car?.name || "Unknown Vehicle"}</td>

                        <td>{booking.driver?.name || "Unassigned"}</td>

                        <td>
                          <span
                            className={`booking-status ${booking.booking_status.toLowerCase()}`}
                          >
                            {booking.booking_status}
                          </span>
                        </td>

                        <td>
                          <div className="table-actions">
                            {/* Confirm button - only for Pending */}
                            {booking.booking_status === "Pending" && (
                              <button
                                className="action-button approve"
                                title={
                                  booking.driver_id
                                    ? "Confirm"
                                    : "Assign a driver from the Bookings page first"
                                }
                                disabled={!booking.driver_id}
                                onClick={() =>
                                  updateBookingStatus(booking.b_id, "Confirmed")
                                }
                              >
                                <Check size={18} />
                              </button>
                            )}

                            {/* Complete button - only for Confirmed */}
                            {booking.booking_status === "Confirmed" && (
                              <button
                                className="action-button reject"
                                title="Complete"
                                onClick={() =>
                                  updateBookingStatus(booking.b_id, "Completed")
                                }
                              >
                                <Flag size={18} />
                              </button>
                            )}

                            {/* Financial-history bookings cannot be deleted. */}
                            {!booking.payment && (
                              <button
                                className="action-button delete"
                                title="Delete"
                                onClick={() => deleteBooking(booking.b_id)}
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </article>

          {/* Right Column */}
          <div className="dashboard-side">
            {/* Emergency Requests */}
            <article className="dashboard-card emergency-card">
              <div className="card-header">
                <h3 className="emergency-title">
                  <span>✚</span>
                  Urgent Dispatch
                </h3>
              </div>

              <div className="emergency-list">
                {ambulanceError && <p role="alert">{ambulanceError}</p>}
                {!ambulanceError && ambulanceBookings === null && <p>Loading ambulance requests...</p>}
                {pendingAmbulances?.length === 0 && <p>No pending ambulance requests.</p>}
                {pendingAmbulances?.slice(0, 3).map((request) => (
                  <div
                    key={request.id}
                    className="emergency-request"
                  >
                    <div className="emergency-request-top">
                      <strong>{request.pickup_district}</strong>
                      <span>#{request.id}</span>
                    </div>

                    <p>{request.pickup_address} → {request.destination_district}</p>

                    <button
                      className="review-button"
                      onClick={() => navigate("/admin/ambulance?section=bookings")}
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            </article>

            {/* Revenue */}
            <article className="dashboard-card revenue-card">
              <div className="card-header">
                <h3>Revenue Trend</h3>
                <button className="more-button">⋮</button>
              </div>

              <div className="revenue-summary">
                {stats && stats.map((stat) => {
                  if (!['Monthly Revenue', 'Total Users', 'Active Bookings'].includes(stat.title)) return null;
                  return (
                    <div key={stat.title} className="revenue-stat">
                      <span>{stat.title}</span>
                      <strong>{stat.value}</strong>
                    </div>
                  );
                })}
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
