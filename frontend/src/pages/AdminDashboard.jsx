import { useState } from "react";
import "../styles/admin-dashboard.css";

const navItems = [
  { label: "Dashboard", icon: "▦" },
  { label: "Manage Users", icon: "♙" },
  { label: "Vehicles", icon: "▱" },
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
    value: "1,204",
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
    value: "862",
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

const bookings = [
  {
    id: "#BK-7829",
    customer: "John Doe",
    initials: "JD",
    vehicle: "Mercedes S-Class",
    status: "Pending",
  },
  {
    id: "#BK-7828",
    customer: "Alice Smith",
    initials: "AS",
    vehicle: "BMW X5",
    status: "Active",
  },
  {
    id: "#BK-7827",
    customer: "Michael Wong",
    initials: "MW",
    vehicle: "Tesla Model 3",
    status: "Completed",
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
  const [activeNav, setActiveNav] = useState("Dashboard");

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
              onClick={() => setActiveNav(item.label)}
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
              ♢
              <span>3</span>
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
            <article
              key={stat.title}
              className={`stat-card ${stat.type}`}
            >
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
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="booking-id">{booking.id}</td>

                      <td>
                        <div className="customer-cell">
                          <div className="customer-avatar">
                            {booking.initials}
                          </div>
                          <span>{booking.customer}</span>
                        </div>
                      </td>

                      <td>{booking.vehicle}</td>

                      <td>
                        <span
                          className={`booking-status ${booking.status.toLowerCase()}`}
                        >
                          {booking.status}
                        </span>
                      </td>

                      <td>
                        <div className="table-actions">
                          {booking.status === "Pending" && (
                            <>
                              <button
                                className="action-button approve"
                                title="Approve"
                              >
                                ✓
                              </button>

                              <button
                                className="action-button reject"
                                title="Reject"
                              >
                                ×
                              </button>
                            </>
                          )}

                          <button
                            className="action-button"
                            title="View"
                          >
                            ◉
                          </button>

                          {booking.status === "Active" && (
                            <button
                              className="action-button delete"
                              title="Delete"
                            >
                              ×
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
                        request.urgent
                          ? "dispatch-button"
                          : "review-button"
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