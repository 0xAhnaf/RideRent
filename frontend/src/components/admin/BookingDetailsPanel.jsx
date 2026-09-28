function BookingDetailsPanel({ bookingId, booking, loading, error, onClose, formatDate, formatAmount }) {
  const fields = booking ? [
    ["Customer", booking.customer_name || "Customer unavailable"],
    ["Mobile", booking.customer_phone || "Phone unavailable"],
    ["Vehicle", booking.car ? `${booking.car.brand} · ${booking.car.name}` : "Vehicle unavailable"],
    ["Category / Seats", booking.car ? `${booking.car.category} · ${booking.car.seats} seats` : "Unavailable"],
    ["Pickup address", booking.pickup],
    ["Destination address", booking.destination],
    ["Trip date & time", formatDate(booking.trip_datetime)],
    ["Trip type", booking.trip_type],
    ["Trip duration", booking.trip_duration],
    ["Booking status", booking.booking_status],
    ["Driver", booking.driver?.name || "Unassigned"],
    ["Driver phone", booking.driver?.phone || "Unavailable"],
    ["Payment status", booking.payment?.payment_status || "Not recorded"],
    ["Payment amount", booking.payment ? `BDT ${formatAmount(booking.payment.amount)}` : "Not recorded"],
    ["Payment method", booking.payment?.payment_method || "Not recorded"],
    ["Transaction reference", booking.payment?.transaction_reference || "Not recorded"],
    ["Paid at", booking.payment?.paid_at ? formatDate(booking.payment.paid_at) : "Not recorded"],
    ["Booking created", formatDate(booking.created_at)],
  ] : [];
  return (
    <section id="normal-booking-details" className="admin-booking-details" aria-label={`Details for booking ${bookingId}`} aria-busy={loading}>
      <div className="admin-booking-details-header">
        <h4>Booking #BK-{bookingId}</h4>
        <button type="button" onClick={onClose}>Close Details</button>
      </div>
      {loading && <p role="status">Loading booking details...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && booking && (
        <dl>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? "Unavailable"}</dd></div>)}</dl>
      )}
    </section>
  );
}

export default BookingDetailsPanel;
