import React from "react";

const text = (value) => value === null || value === undefined || value === "" ? "—" : String(value);
const money = (value) => `৳${Number.isFinite(Number(value)) ? Number(value).toLocaleString("en-BD", { maximumFractionDigits: 2 }) : "0"}`;
function StatusBadge({ value }) {
  const status = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const tone = ["completed", "paid", "success", "successful"].includes(status) ? "success" :
    ["pending", "unpaid", "not_paid", "requested", "awaiting_payment"].includes(status) ? "pending" :
    ["cancelled", "canceled", "failed", "rejected"].includes(status) ? "danger" :
    ["confirmed", "accepted", "ongoing", "in_progress"].includes(status) ? "info" : "neutral";
  return <span className={`status-badge ${tone}`}>{status ? String(value).replace(/_/g, " ") : "Not available"}</span>;
}


function PaymentAmount({ amount, status }) {
  const normalized = String(status ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "paid") {
    if (amount === null || amount === undefined || String(amount).trim() === "" || !Number.isFinite(Number(amount))) {
      return <span>Amount unavailable</span>;
    }
    return <span>{money(amount)}</span>;
  }
  if (["", "pending", "unpaid", "not_paid", "requested", "awaiting_payment"].includes(normalized)) {
    return <StatusBadge value="Unpaid" />;
  }
  return <StatusBadge value={status} />;
}

const vehicleColumns = [
  ["booking_id", "Booking ID"], ["vehicle_name", "Vehicle"], ["vehicle_brand", "Brand"],
  ["vehicle_category", "Category"], ["trip_type", "Trip Type"], ["trip_datetime", "Trip Date"],
  ["trip_duration", "Duration"], ["pickup", "Pickup"], ["destination", "Destination"],
];
const ambulanceColumns = [
  ["booking_id", "Booking ID"], ["pickup_district", "Pickup District"], ["pickup_thana", "Pickup Thana"],
  ["pickup_address", "Pickup Address"], ["destination_district", "Destination District"],
  ["destination_thana", "Destination Thana"], ["destination_address", "Destination Address"],
  ["emergency_contact", "Emergency Contact"], ["status", "Status", "status"], ["created_at", "Created At"],
];

function HistoryCard({ id, title, description, rows, columns, empty }) {
  return <section className="history-card" aria-labelledby={id}>
    <div className="renter-card-heading"><div><h2 id={id}>{title}</h2><p>{description}</p></div><span className="renter-count">{rows.length} {rows.length === 1 ? "record" : "records"}</span></div>
    {rows.length === 0 ? <div className="renter-empty"><span aria-hidden="true">—</span><p>{empty}</p></div> :
      <div className="table-container" role="region" aria-labelledby={id} tabIndex={0}><table className="rental-table"><thead><tr>{columns.map(([key, label]) => <th key={key} scope="col">{label}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={row.booking_id ?? index}>{columns.map(([key, label, type]) => <td key={key} data-label={label} className={type === "money" || type === "payment" ? "renter-amount" : undefined}>{type === "status" ? <StatusBadge value={row[key]} /> : type === "payment" ? <PaymentAmount amount={row[key]} status={row.payment_status} /> : type === "money" ? money(row[key] ?? 0) : text(row[key])}</td>)}</tr>)}</tbody>
      </table></div>}
  </section>;
}

export default function RentalActivity({ bookingStatistics, vehicleBookings = [], completedVehicleTrips = [], ambulanceBookings = [], loading, error }) {
  const stats = [["Total Bookings", bookingStatistics?.total_bookings ?? 0, "gold"], ["Completed Rentals", bookingStatistics?.completed_bookings ?? 0, ""], ["Cancelled Rentals", bookingStatistics?.cancelled_bookings ?? 0, ""], ["Total Spent", money(bookingStatistics?.total_spent ?? 0), "gold"]];
  return <>
    <header className="renter-page-heading"><span className="renter-eyebrow">YOUR JOURNEYS</span><h1>Rental Activity</h1><p>Review your bookings, completed trips and payment history.</p></header>
    {loading ? <div className="renter-notice" role="status">Loading rental activity...</div> : error ? <div className="renter-notice error" role="alert">{error}</div> : <>
      <div className="statistics-grid">{stats.map(([label, value, tone]) => <article className={`stat-card ${tone}`} key={label}><h3>{label}</h3><p>{value}</p></article>)}</div>
      <HistoryCard id="vehicle-history" title="Vehicle Bookings" description="Your vehicle reservations and trip details." rows={vehicleBookings} columns={[...vehicleColumns, ["booking_status", "Booking Status", "status"], ["total_amount", "Amount Paid", "payment"]]} empty="No vehicle booking history yet." />
      <HistoryCard id="completed-history" title="Completed Vehicle Trips" description="Completed journeys and their payment details." rows={completedVehicleTrips} columns={[...vehicleColumns, ["payment_method", "Payment Method"], ["payment_status", "Payment Status", "status"], ["payment_amount", "Amount", "money"]]} empty="No completed vehicle trips yet." />
      <HistoryCard id="ambulance-history" title="Ambulance Bookings" description="Your ambulance requests and booking status." rows={ambulanceBookings} columns={ambulanceColumns} empty="No ambulance booking history yet." />
    </>}
  </>;
}
