import { useState } from "react";
import { ambulanceRequest } from "./ambulanceApi";

const transitions = { pending: ["confirmed", "cancelled"], confirmed: ["completed", "cancelled"], completed: [], cancelled: [] };

function AmbulanceBookingsSection({ bookings, drivers, onChanged, onPayment }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selections, setSelections] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetails] = useState(null);

  async function perform(path, options) {
    setBusy(true);
    setError("");
    try {
      const data = await ambulanceRequest(path, options);
      if (options) onChanged(data.message);
      else setDetails(data.booking);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  const filtered = bookings.filter((booking) => (status === "all" || booking.status === status) &&
    [booking.id, booking.customer_name, booking.pickup_district, booking.destination_district, booking.emergency_contact]
      .some((value) => String(value ?? "").toLowerCase().includes(search.trim().toLowerCase())));

  return (
    <section className="dashboard-card ambulance-records">
      <div className="ambulance-toolbar"><h3>Ambulance Bookings</h3>
        <input aria-label="Search ambulance bookings" type="search" placeholder="Search bookings..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <select aria-label="Filter booking status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>{Object.keys(transitions).map((value) => <option key={value}>{value}</option>)}
        </select>
      </div>
      {error && <p className="ambulance-message error" role="alert">{error}</p>}
      {details && <div className="ambulance-details">
        <h4>Booking #AMB-{details.id}</h4>
        <p>{details.customer_name} · {details.customer_email}</p>
        <p><strong>Pickup:</strong> {details.pickup_address}, {details.pickup_thana}, {details.pickup_district}</p>
        <p><strong>Destination:</strong> {details.destination_address}, {details.destination_thana}, {details.destination_district}</p>
        <p><strong>Emergency Contact:</strong> {details.emergency_contact}</p>
        <p><strong>Driver:</strong> {details.driver_name || "Unassigned"} {details.driver_phone}</p>
        <p><strong>Status:</strong> {details.status} · <strong>Created:</strong> {details.created_at}</p>
        <button type="button" onClick={() => setDetails(null)}>Close Details</button>
      </div>}
      <div className="ambulance-table-wrapper"><table className="ambulance-table">
        <thead><tr><th>Booking / Customer</th><th>Trip</th><th>Driver</th><th>Status / Payment</th><th>Actions</th></tr></thead>
        <tbody>
          {filtered.length === 0 && <tr><td colSpan="5">No ambulance bookings match the current filters.</td></tr>}
          {filtered.map((booking) => {
            const selection = selections[booking.id] ?? String(booking.ambulance_driver_id ?? "");
            const active = ["pending", "confirmed"].includes(booking.status);
            return <tr key={booking.id}>
              <td data-label="Booking / Customer"><strong>#AMB-{booking.id}</strong><p>{booking.customer_name}</p><small>{booking.emergency_contact}</small></td>
              <td data-label="Trip">{booking.pickup_district}<p>→ {booking.destination_district}</p></td>
              <td data-label="Driver"><p>{booking.driver_name || "Unassigned"}</p>
                {active && <div className="ambulance-actions">
                  <select aria-label={`Driver for booking ${booking.id}`} value={selection} disabled={busy} onChange={(event) => setSelections({ ...selections, [booking.id]: event.target.value })}>
                    <option value="">Unassigned</option>
                    {drivers.filter((driver) => driver.status === "available" || driver.id === booking.ambulance_driver_id).map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
                  </select>
                  <button type="button" disabled={busy || selection === String(booking.ambulance_driver_id ?? "")} onClick={() => perform(`/bookings/${booking.id}/driver`, {
                    method: selection ? "PUT" : "DELETE", ...(selection ? { body: JSON.stringify({ ambulance_driver_id: Number(selection) }) } : {}),
                  })}>Save</button>
                </div>}
              </td>
              <td data-label="Status / Payment"><span className="ambulance-badge">{booking.status}</span><p>{booking.payment_status || "No payment"}</p></td>
              <td data-label="Actions"><div className="ambulance-actions">
                <button type="button" disabled={busy} onClick={() => perform(`/bookings/${booking.id}`)}>Details</button>
                {(transitions[booking.status] || []).map((next) => <button key={next} type="button" className={next === "cancelled" ? "danger" : ""} disabled={busy || (next === "confirmed" && !booking.ambulance_driver_id)} onClick={() => {
                  if (next === "cancelled" && !window.confirm(`Cancel ambulance booking #${booking.id}?`)) return;
                  perform(`/bookings/${booking.id}/status`, { method: "PATCH", body: JSON.stringify({ status: next }) });
                }}>{next === "confirmed" ? "Confirm" : next === "completed" ? "Complete" : "Cancel"}</button>)}
                {(booking.payment_id || ["confirmed", "completed"].includes(booking.status)) && <button type="button" onClick={() => onPayment(booking.id)}>Payment</button>}
              </div></td>
            </tr>;
          })}
        </tbody>
      </table></div>
    </section>
  );
}

export default AmbulanceBookingsSection;
