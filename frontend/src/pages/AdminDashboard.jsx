import { useEffect, useState } from "react";
import { Check, Flag, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/admin-dashboard.css";

const navItems = [
  { label: "Dashboard", icon: "▦" },
  { label: "Manage Users", icon: "♙" },
  { label: "Vehicles", icon: "▱", path: "/admin/admin-vehicle" },
  { label: "Drivers", icon: "♧" },
  { label: "Bookings", icon: "▣", active: true },
  { label: "Payments", icon: "৳" },
  { label: "Ambulance / Emergency", icon: "✚", danger: true },
  { label: "Reviews", icon: "☆" },
  { label: "Reports", icon: "▥" },
];

const stats = [
  {
    title: "Total Users",
    value: "24,592",
    change: "+12%",
    icon: "♙",
    type: "normal",
  },
  {
    title: "Total Vehicles",
    value: "84",
    change: "+5%",
    icon: "▱",
    type: "normal",
  },
  {
    title: "Active Bookings",
    value: "342",
    change: "Active",
    icon: "▣",
    type: "active",
  },
  {
    title: "Available Vehicles",
    value: "19",
    icon: "▰",
    type: "normal",
  },
  {
    title: "Pending Ambulance",
    value: "3",
    change: "Urgent",
    icon: "✚",
    type: "danger",
  },
  {
    title: "Monthly Revenue",
    value: "$124.5K",
    change: "+18%",
    icon: "৳",
    type: "normal",
  },
];

const emergencyRequests = [
  {
    location: "Downtown Metro",
    time: "2 mins ago",
    description:
      "Cardiac emergency reported. Needs Immediate Life Support unit.",
    urgent: true,
  },
  {
    location: "Westside Clinic",
    time: "15 mins ago",
    description: "Non-emergency transport requested.",
    urgent: false,
  },
];

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("Dashboard");

  const handleNavigation = (item) => {
    setActiveNav(item.label);

    if (item.path) {
      navigate(item.path);
    }
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

        const response = await fetch("http://127.0.0.1:8000/api/bookings");

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
      const response = await fetch(
        `http://127.0.0.1:8000/api/bookings/${bookingId}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete booking.");
      }


      setBookings((currentBookings) =>
        currentBookings.filter((booking) => booking.b_id !== bookingId),
      );
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  // UPDATE: Change booking status
  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/bookings/${bookingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            booking_status: newStatus,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update booking status.");
      }

      const data = await response.json();

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.b_id === bookingId
            ? {
                ...booking,
                booking_status: data.booking.booking_status,
              }
            : booking,
        ),
      );
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img
            src="/src/assets/logo_nobg.png"
            alt="RideRent logo"
            className="admin-logo"
          />

          <div>
            <h1>RideRent</h1>
            <p>Admin Portal</p>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`admin-nav-item ${
                activeNav === item.label ? "active" : ""
              } ${item.danger ? "danger-item" : ""}`}
              onClick={() => handleNavigation(item)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item">
            <span className="nav-icon">?</span>
            <span>Support</span>
          </button>

          <button className="admin-nav-item">
            <span className="nav-icon">↪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div>
            <h2>Overview</h2>
            <p>Real-time system metrics and pending actions.</p>
          </div>

          <div className="admin-header-right">
            <button className="notification-button" aria-label="Notifications">
              ♢<span>3</span>
            </button>

            <div className="admin-profile">
              <div className="admin-avatar">A</div>

              <div className="admin-profile-info">
                <strong>Admin User</strong>
                <span>System Administrator</span>
              </div>
            </div>
          </div>
        </header>

        {/* KPI Cards */}
        <section className="stats-grid">
          {stats.map((stat) => (
            <article key={stat.title} className={`stat-card ${stat.type}`}>
              <div className="stat-top">
                <div className="stat-icon">{stat.icon}</div>

                {stat.change && (
                  <span className="stat-change">{stat.change}</span>
                )}
              </div>

              <div>
                <h3>{stat.title}</h3>
                <p>{stat.value}</p>
              </div>
            </article>
          ))}
        </section>

        {/* Main Dashboard Grid */}
        <section className="dashboard-grid">
          {/* Recent Bookings */}
          <article className="dashboard-card bookings-card">
            <div className="card-header">
              <h3>Recent Bookings</h3>

              <button className="view-all-button">
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
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {/* Loading state */}
                  {loadingBookings && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center" }}>
                        Loading bookings...
                      </td>
                    </tr>
                  )}

                  {/* Error state */}
                  {!loadingBookings && bookingError && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center" }}>
                        {bookingError}
                      </td>
                    </tr>
                  )}

                  {/* Empty state */}
                  {!loadingBookings &&
                    !bookingError &&
                    bookings.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center" }}>
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
                                title="Confirm"
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

                            {/* Delete */}
                            <button
                              className="action-button delete"
                              title="Delete"
                              onClick={() => deleteBooking(booking.b_id)}
                            >
                              <Trash2 size={18} />
                            </button>
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
                {emergencyRequests.map((request) => (
                  <div
                    key={request.location}
                    className={`emergency-request ${
                      request.urgent ? "urgent" : ""
                    }`}
                  >
                    <div className="emergency-request-top">
                      <strong>Loc: {request.location}</strong>
                      <span>{request.time}</span>
                    </div>

                    <p>{request.description}</p>

                    <button
                      className={
                        request.urgent ? "dispatch-button" : "review-button"
                      }
                    >
                      {request.urgent ? "Dispatch Now" : "Review"}
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

              <div className="revenue-chart">
                <div className="chart-bars">
                  <span style={{ height: "40%" }} />
                  <span style={{ height: "60%" }} />
                  <span style={{ height: "30%" }} />
                  <span style={{ height: "80%" }} />
                  <span className="highlight" style={{ height: "95%" }} />
                </div>

                <p>Chart Data Loading...</p>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;