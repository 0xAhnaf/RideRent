import { useState } from "react";
import { ambulanceRequest } from "./ambulanceApi";

const initialForm = (bookingId = "") => ({ ambulance_booking_id: bookingId, amount: "", payment_method: "cash", payment_status: "pending", transaction_reference: "" });

function AmbulancePaymentsSection({ payments, bookings, onChanged, selectedBookingId }) {
  const [form, setForm] = useState(() => initialForm(selectedBookingId || ""));
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(() => Boolean(selectedBookingId && !payments.some((payment) => String(payment.ambulance_booking_id) === selectedBookingId)));
  const [search, setSearch] = useState(selectedBookingId || "");
  const [status, setStatus] = useState("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetails] = useState(null);
  const eligibleBookings = bookings.filter((booking) => ["confirmed", "completed"].includes(booking.status) && !booking.payment_id);

  async function perform(path, options) {
    setBusy(true);
    setError("");
    try {
      const result = await ambulanceRequest(path, options);
      if (options) onChanged(result.message);
      else setDetails(result.payment);
      return result;
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  function edit(payment) {
    setForm({ ...payment });
    setEditingId(payment.id);
    setShowForm(true);
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    const data = { amount: form.amount, payment_method: form.payment_method, transaction_reference: form.transaction_reference || null };
    if (editingId === null) {
      data.ambulance_booking_id = Number(form.ambulance_booking_id);
      data.payment_status = form.payment_status;
    }
    const result = await perform(editingId === null ? "/payments" : `/payments/${editingId}`, { method: editingId === null ? "POST" : "PUT", body: JSON.stringify(data) });
    if (result) {
      setEditingId(null);
      setForm(initialForm());
      setShowForm(false);
    }
  }

  const filtered = payments.filter((payment) => (status === "all" || payment.payment_status === status) &&
    [payment.id, payment.ambulance_booking_id, payment.customer_name, payment.transaction_reference]
      .some((value) => String(value ?? "").toLowerCase().includes(search.trim().toLowerCase())));

  return (
    <section className="dashboard-card ambulance-records">
      <div className="ambulance-toolbar"><h3>Ambulance Payments</h3>
        <button type="button" className="primary" disabled={busy} onClick={() => { setEditingId(null); setForm(initialForm()); setShowForm(true); setError(""); }}>Add Payment</button>
        <input type="search" aria-label="Search ambulance payments" placeholder="Search payments..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <select aria-label="Filter payment status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>{["pending", "paid", "refunded"].map((value) => <option key={value}>{value}</option>)}
        </select>
      </div>
      {error && <p className="ambulance-message error" role="alert">{error}</p>}
      {showForm && <form className="ambulance-form" onSubmit={submit}>
        <h4>{editingId === null ? "New Payment" : `Edit Payment #${editingId}`}</h4>
        {editingId === null && <label>Ambulance Booking
          <select required value={form.ambulance_booking_id} onChange={(event) => setForm({ ...form, ambulance_booking_id: event.target.value })}>
            <option value="">Select a confirmed or completed booking</option>
            {eligibleBookings.map((booking) => <option key={booking.id} value={booking.id}>#AMB-{booking.id} · {booking.customer_name}</option>)}
          </select>
        </label>}
        <label>Amount (BDT)<input required type="number" min="0.01" max="99999999.99" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label>
        <label>Payment Method<select value={form.payment_method} onChange={(event) => setForm({ ...form, payment_method: event.target.value })}>
          <option value="cash">Cash</option><option value="card">Card</option><option value="mobile_banking">Mobile Banking</option>
        </select></label>
        {editingId === null && <label>Payment Status<select value={form.payment_status} onChange={(event) => setForm({ ...form, payment_status: event.target.value })}>
          <option value="pending">Pending</option><option value="paid">Paid</option>
        </select></label>}
        <label>Transaction Reference<input maxLength={100} value={form.transaction_reference || ""} onChange={(event) => setForm({ ...form, transaction_reference: event.target.value })} /></label>
        <div className="ambulance-actions"><button className="primary" disabled={busy}>{busy ? "Saving..." : "Save Payment"}</button><button type="button" disabled={busy} onClick={() => setShowForm(false)}>Cancel</button></div>
      </form>}
      {details && <div className="ambulance-details"><h4>Payment #AMP-{details.id}</h4>
        <p>Booking #AMB-{details.ambulance_booking_id} · {details.customer_name}</p>
        <p>৳{details.amount} · {details.payment_method} · {details.payment_status}</p>
        <p>Reference: {details.transaction_reference || "Not provided"}</p><p>Paid at: {details.paid_at || "Not paid"}</p>
        <button type="button" onClick={() => setDetails(null)}>Close Details</button>
      </div>}
      <div className="ambulance-table-wrapper"><table className="ambulance-table">
        <thead><tr><th>Payment / Booking</th><th>Customer</th><th>Amount / Method</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{filtered.length === 0 && <tr><td colSpan="5">No ambulance payments match the current filters.</td></tr>}
          {filtered.map((payment) => <tr key={payment.id}>
            <td data-label="Payment / Booking"><strong>#AMP-{payment.id}</strong><p>#AMB-{payment.ambulance_booking_id}</p></td>
            <td data-label="Customer">{payment.customer_name}</td>
            <td data-label="Amount / Method">৳{payment.amount}<p>{payment.payment_method.replaceAll("_", " ")}</p></td>
            <td data-label="Status"><span className="ambulance-badge">{payment.payment_status}</span></td>
            <td data-label="Actions"><div className="ambulance-actions">
              <button type="button" disabled={busy} onClick={() => perform(`/payments/${payment.id}`)}>Details</button>
              {payment.payment_status === "pending" && <>
                <button type="button" disabled={busy} onClick={() => edit(payment)}>Edit</button>
                <button type="button" disabled={busy} onClick={() => {
                  if (window.confirm(`Mark payment #${payment.id} as paid?`)) perform(`/payments/${payment.id}/status`, { method: "PATCH", body: JSON.stringify({ payment_status: "paid" }) });
                }}>Mark Paid</button>
                <button type="button" className="danger" disabled={busy} onClick={() => {
                  if (window.confirm(`Delete pending payment #${payment.id}?`)) perform(`/payments/${payment.id}`, { method: "DELETE" });
                }}>Delete</button>
              </>}
              {payment.payment_status === "paid" && <button type="button" disabled={busy} onClick={() => {
                if (window.confirm(`Record a refund for payment #${payment.id}?`)) perform(`/payments/${payment.id}/status`, { method: "PATCH", body: JSON.stringify({ payment_status: "refunded" }) });
              }}>Refund</button>}
            </div></td>
          </tr>)}
        </tbody>
      </table></div>
    </section>
  );
}

export default AmbulancePaymentsSection;
