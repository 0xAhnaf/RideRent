import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Ambulance, CreditCard, UserRound } from "lucide-react";
import AdminHeader from "../components/admin/AdminHeader";
import AdminSidebar from "../components/admin/AdminSidebar";
import AmbulanceDriversSection from "../components/admin/ambulance/AmbulanceDriversSection";
import AmbulanceBookingsSection from "../components/admin/ambulance/AmbulanceBookingsSection";
import AmbulancePaymentsSection from "../components/admin/ambulance/AmbulancePaymentsSection";
import { ambulanceRequest } from "../components/admin/ambulance/ambulanceApi";
import "../styles/admin-dashboard.css";
import "../styles/admin-ambulance-page.css";

function AdminAmbulancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSection = searchParams.get("section");
  const section = ["drivers", "bookings", "payments"].includes(requestedSection)
    ? requestedSection
    : "bookings";
  const [records, setRecords] = useState(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadRecords() {
      setLoading(true);
      setError("");
      try {
        const options = { signal: controller.signal };
        const [drivers, bookings, payments, summary] = await Promise.all([
          ambulanceRequest("/drivers", options),
          ambulanceRequest("/bookings", options),
          ambulanceRequest("/payments", options),
          ambulanceRequest("/payments-summary", options),
        ]);
        if (!controller.signal.aborted) {
          setRecords({
            drivers: drivers.drivers,
            bookings: bookings.bookings,
            payments,
            summary: summary.summary,
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
    loadRecords();
    return () => controller.abort();
  }, [revision]);

  const refresh = (successMessage = "") => {
    setMessage(typeof successMessage === "string" ? successMessage : "");
    setRevision((current) => current + 1);
  };

  const openPayments = (bookingId) => {
    setSearchParams({ section: "payments", booking_id: String(bookingId) });
  };
  const sections = [
    { key: "drivers", label: "Ambulance Drivers", icon: UserRound, count: records?.drivers.length },
    { key: "bookings", label: "Ambulance Bookings", icon: Ambulance, count: records?.bookings.length },
    { key: "payments", label: "Ambulance Payments", icon: CreditCard, count: records?.payments.length },
  ];

  return (
    <div className="admin-layout">
      <AdminSidebar activeItem="Ambulance" />
      <main className="admin-main ambulance-main">
        <AdminHeader
          title="Ambulance Management"
          subtitle="Manage ambulance drivers, dispatch requests and payments."
        />
        <nav className="ambulance-sections" aria-label="Ambulance management sections">
          {sections.map(({ key, label, icon: Icon, count }) => (
            <button
              type="button"
              key={key}
              className={`dashboard-card ambulance-section-link ${section === key ? "selected" : ""}`}
              aria-current={section === key ? "page" : undefined}
              onClick={() => { setMessage(""); setSearchParams({ section: key }); }}
            >
              <Icon size={22} />
              <span>{label}</span>
              <strong>{loading || error ? "—" : count}</strong>
            </button>
          ))}
        </nav>
        {loading && <p role="status">Loading ambulance records...</p>}
        {message && <p className="ambulance-message success" role="status">{message}</p>}
        {error && <div className="ambulance-message error" role="alert">{error} <button type="button" onClick={refresh}>Retry</button></div>}
        {!loading && !error && records && (
          <>
            <section className="ambulance-summary" aria-label="Ambulance summary">
              <article className="dashboard-card"><span>Available Drivers</span><strong>{records.drivers.filter((driver) => driver.status === "available").length}</strong></article>
              <article className="dashboard-card"><span>Pending Bookings</span><strong>{records.bookings.filter((booking) => booking.status === "pending").length}</strong></article>
              <article className="dashboard-card"><span>Collected Payments</span><strong>৳{records.summary.total_collected}</strong></article>
            </section>
            {section === "drivers" && <AmbulanceDriversSection onChanged={refresh} />}
            {section === "payments" && (
              <AmbulancePaymentsSection
                key={searchParams.get("booking_id") || "payments"}
                payments={records.payments}
                bookings={records.bookings}
                onChanged={refresh}
                selectedBookingId={searchParams.get("booking_id")}
              />
            )}
            {section === "bookings" && (
              <AmbulanceBookingsSection
                bookings={records.bookings}
                drivers={records.drivers}
                onChanged={refresh}
                onPayment={openPayments}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default AdminAmbulancePage;
