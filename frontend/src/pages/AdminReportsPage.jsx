import { useEffect, useState } from "react";
import {
  Banknote,
  CalendarClock,
  Car,
  ChartNoAxesCombined,
  CircleDollarSign,
  CreditCard,
  Gauge,
  UsersRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import BusinessInsightsSection from "../components/reports/BusinessInsightsSection";
import FleetOpportunitiesSection from "../components/reports/FleetOpportunitiesSection";
import RelationshipReportsSection from "../components/reports/RelationshipReportsSection";
import { apiFetch } from "../api";
import "../styles/admin-dashboard.css";
import "../styles/admin-reports-page.css";

const navItems = [
  { label: "Dashboard", icon: "◦", path: "/admin" },
  { label: "Manage Users", icon: "♙" },
  { label: "Vehicles", icon: "▱", path: "/admin/admin-vehicle" },
  { label: "Drivers", icon: "♧", path: "/admin/drivers" },
  { label: "Bookings", icon: "▣", path: "/admin/bookings" },
  { label: "Payments", icon: "৳", path: "/admin/payments" },
  { label: "Ambulance / Emergency", icon: "✚", danger: true },
  { label: "Reviews", icon: "☆" },
  { label: "Reports", icon: "▥", path: "/admin/reports" },
];

const emptySummary = {
  overview: {
    vehicle_models: 0,
    total_vehicle_units: 0,
    total_drivers: 0,
    total_bookings: 0,
    total_payments: 0,
  },
  payment_overview: {
    paid_payments: 0,
    total_revenue: 0,
    average_payment: 0,
    minimum_payment: null,
    maximum_payment: null,
  },
  booking_timeline: {
    first_booking: null,
    latest_booking: null,
  },
};

const formatNumber = (value) => Number(value || 0).toLocaleString("en-BD");

const formatCurrency = (value) => {
  if (value === null || value === undefined) {
    return "No paid records";
  }

  return `৳${Number(value).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const formatBookingDate = (booking) => {
  if (!booking?.created_at) {
    return "No booking recorded";
  }

  const parsedDate = new Date(String(booking.created_at).replace(" ", "T"));

  if (Number.isNaN(parsedDate.getTime())) {
    return booking.created_at;
  }

  return parsedDate.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

function AdminReportsPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(emptySummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadSummary = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiFetch("/api/reports/summary", {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.message || "Unable to load report summary.");
        }

        setSummary({
          overview: { ...emptySummary.overview, ...(result.overview || {}) },
          payment_overview: {
            ...emptySummary.payment_overview,
            ...(result.payment_overview || {}),
          },
          booking_timeline: {
            ...emptySummary.booking_timeline,
            ...(result.booking_timeline || {}),
          },
        });
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          console.error("Error loading report summary:", requestError);
          setError(requestError.message || "Unable to load report summary.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadSummary();

    return () => controller.abort();
  }, []);

  const overviewCards = [
    {
      label: "Vehicle Models",
      value: formatNumber(summary.overview.vehicle_models),
      helper: `${formatNumber(summary.overview.total_vehicle_units)} total units`,
      icon: Car,
    },
    {
      label: "Registered Drivers",
      value: formatNumber(summary.overview.total_drivers),
      helper: "Drivers in the fleet",
      icon: UsersRound,
    },
    {
      label: "Total Bookings",
      value: formatNumber(summary.overview.total_bookings),
      helper: "All booking records",
      icon: CalendarClock,
    },
    {
      label: "Payment Records",
      value: formatNumber(summary.overview.total_payments),
      helper: `${formatNumber(summary.payment_overview.paid_payments)} marked as paid`,
      icon: CreditCard,
    },
  ];

  const paymentCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(summary.payment_overview.total_revenue),
      icon: CircleDollarSign,
    },
    {
      label: "Average Payment",
      value: formatCurrency(summary.payment_overview.average_payment),
      icon: ChartNoAxesCombined,
    },
    {
      label: "Lowest Payment",
      value: formatCurrency(summary.payment_overview.minimum_payment),
      icon: Gauge,
    },
    {
      label: "Highest Payment",
      value: formatCurrency(summary.payment_overview.maximum_payment),
      icon: Banknote,
    },
  ];

  const timelineItems = [
    {
      label: "First Recorded Booking",
      booking: summary.booking_timeline.first_booking,
    },
    {
      label: "Latest Recorded Booking",
      booking: summary.booking_timeline.latest_booking,
    },
  ];

  return (
    <div className="admin-layout">
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
              type="button"
              className={`admin-nav-item ${
                item.label === "Reports" ? "active" : ""
              } ${item.danger ? "danger-item" : ""}`}
              onClick={() => item.path && navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button type="button" className="admin-nav-item">
            <span className="nav-icon">?</span>
            <span>Support</span>
          </button>

          <button type="button" className="admin-nav-item">
            <span className="nav-icon">↪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main admin-report-main">
        <header className="admin-header">
          <div>
            <h2>Reports &amp; Analytics</h2>
            <p>Review RideRent&apos;s fleet, booking, and payment performance.</p>
          </div>

          <div className="admin-header-right">
            <div className="admin-profile">
              <div className="admin-avatar">A</div>
              <div className="admin-profile-info">
                <strong>Admin User</strong>
                <span>System Administrator</span>
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="admin-report-message error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="admin-report-loading" role="status">
            <span className="admin-report-spinner" />
            <p>Loading report data...</p>
          </div>
        ) : (
          <div className="admin-report-content">
            <section aria-labelledby="operational-overview-title">
              <div className="admin-report-section-heading">
                <div>
                  <span>BUSINESS OVERVIEW</span>
                  <h3 id="operational-overview-title">Operational Snapshot</h3>
                </div>
                <p>Current records across the RideRent system.</p>
              </div>

              <div className="admin-report-overview-grid">
                {overviewCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <article className="admin-report-overview-card" key={card.label}>
                      <div className="admin-report-card-icon">
                        <Icon size={22} aria-hidden="true" />
                      </div>
                      <div>
                        <span>{card.label}</span>
                        <strong>{card.value}</strong>
                        <small>{card.helper}</small>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="admin-report-panel" aria-labelledby="payment-overview-title">
              <div className="admin-report-section-heading panel-heading">
                <div>
                  <span>PAYMENT PERFORMANCE</span>
                  <h3 id="payment-overview-title">Revenue Overview</h3>
                </div>
                <p>Calculated from payment records marked as paid.</p>
              </div>

              <div className="admin-report-payment-grid">
                {paymentCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <article className="admin-report-payment-card" key={card.label}>
                      <div className="admin-report-payment-icon">
                        <Icon size={20} aria-hidden="true" />
                      </div>
                      <span>{card.label}</span>
                      <strong>{card.value}</strong>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="admin-report-panel" aria-labelledby="booking-timeline-title">
              <div className="admin-report-section-heading panel-heading">
                <div>
                  <span>BOOKING ACTIVITY</span>
                  <h3 id="booking-timeline-title">Booking Timeline</h3>
                </div>
                <p>The earliest and most recent booking records.</p>
              </div>

              <div className="admin-report-timeline-grid">
                {timelineItems.map(({ label, booking }) => (
                  <article className="admin-report-timeline-card" key={label}>
                    <div className="admin-report-timeline-top">
                      <span>{label}</span>
                      {booking && <strong>BK-{booking.b_id}</strong>}
                    </div>
                    <p>{formatBookingDate(booking)}</p>
                    {booking && (
                      <small className={`status-${booking.booking_status?.toLowerCase()}`}>
                        {booking.booking_status}
                      </small>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <RelationshipReportsSection />
            <BusinessInsightsSection />
            <FleetOpportunitiesSection />
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminReportsPage;
