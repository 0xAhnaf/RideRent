import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import "../styles/admin-dashboard.css";
import "../styles/admin-payments-page.css";

const API_BASE_URL = "http://localhost:8000/api";

const navItems = [
  { label: "Dashboard", icon: "▦", path: "/admin" },
  { label: "Manage Users", icon: "♙" },
  { label: "Vehicles", icon: "▱", path: "/admin/admin-vehicle" },
  { label: "Drivers", icon: "♧", path: "/admin/drivers" },
  { label: "Bookings", icon: "▣", path: "/admin/bookings" },
  { label: "Payments", icon: "৳", path: "/admin/payments" },
  { label: "Ambulance / Emergency", icon: "✚", danger: true },
  { label: "Reviews", icon: "☆" },
  { label: "Reports", icon: "▥", path: "/admin/reports" },
];

const createInitialForm = () => ({
  booking_id: "",
  amount: "",
  payment_method: "cash",
  payment_status: "pending",
  transaction_reference: "",
});

const emptySummary = {
  total_payments: 0,
  pending_count: 0,
  paid_count: 0,
  refunded_count: 0,
  total_collected: 0,
  total_refunded: 0,
  average_paid_amount: 0,
  minimum_amount: 0,
  maximum_amount: 0,
};

const getApiErrorMessage = (result, fallbackMessage) => {
  const validationMessage = result?.errors
    ? Object.values(result.errors).flat()[0]
    : null;

  return validationMessage || result?.message || fallbackMessage;
};

const requestJson = async (url, options = {}, fallbackMessage) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getApiErrorMessage(result, fallbackMessage));
  }

  return result;
};

const loadPaymentData = async (signal) => {
  const requestOptions = signal ? { signal } : {};
  const [paymentsResult, bookingsResult, summaryResult] = await Promise.all([
    requestJson(
      `${API_BASE_URL}/payments`,
      requestOptions,
      "Unable to load payments.",
    ),
    requestJson(
      `${API_BASE_URL}/bookings`,
      requestOptions,
      "Unable to load bookings.",
    ),
    requestJson(
      `${API_BASE_URL}/payments/summary`,
      requestOptions,
      "Unable to load payment summary.",
    ),
  ]);

  return {
    payments: Array.isArray(paymentsResult)
      ? paymentsResult
      : paymentsResult.payments || [],
    bookings: Array.isArray(bookingsResult)
      ? bookingsResult
      : bookingsResult.bookings || [],
    summary: summaryResult.summary || emptySummary,
  };
};

const formatAmount = (amount) =>
  new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const formatDateTime = (value) => {
  if (!value) {
    return "Not paid yet";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
};

const formatMethod = (method) =>
  ({
    cash: "Cash",
    card: "Card",
    mobile_banking: "Mobile Banking",
  })[method] || method;

const MethodIcon = ({ method }) => {
  if (method === "card") {
    return <CreditCard size={16} aria-hidden="true" />;
  }

  if (method === "mobile_banking") {
    return <Smartphone size={16} aria-hidden="true" />;
  }

  return <Banknote size={16} aria-hidden="true" />;
};

function AdminPaymentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formRef = useRef(null);
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [formData, setFormData] = useState(createInitialForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [busyPaymentId, setBusyPaymentId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const applyPageData = (pageData) => {
    setPayments(pageData.payments);
    setBookings(pageData.bookings);
    setSummary({ ...emptySummary, ...pageData.summary });
  };

  useEffect(() => {
    const controller = new AbortController();

    const initializePage = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const pageData = await loadPaymentData(controller.signal);
        applyPageData(pageData);

        const requestedBookingId = Number(searchParams.get("booking_id"));
        const requestedBooking = pageData.bookings.find(
          (booking) =>
            booking.b_id === requestedBookingId &&
            ["Confirmed", "Completed"].includes(booking.booking_status) &&
            !booking.payment,
        );

        if (requestedBooking) {
          setFormData({
            ...createInitialForm(),
            booking_id: String(requestedBooking.b_id),
            amount: requestedBooking.car?.price
              ? String(requestedBooking.car.price)
              : "",
          });
          setShowForm(true);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error loading payment management data:", error);
          setLoadError(error.message || "Unable to load payment records.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    initializePage();

    return () => controller.abort();
  }, []);

  const eligibleBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          ["Confirmed", "Completed"].includes(booking.booking_status) &&
          !booking.payment,
      ),
    [bookings],
  );

  const filteredPayments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return payments.filter((payment) => {
      const booking = payment.booking;
      const matchesStatus =
        statusFilter === "all" || payment.payment_status === statusFilter;
      const searchableValues = [
        payment.id,
        payment.transaction_reference,
        payment.payment_method,
        booking?.b_id,
        booking?.u_id,
        booking?.car?.name,
        booking?.driver?.name,
      ];
      const matchesSearch =
        !normalizedSearch ||
        searchableValues.some((value) =>
          String(value ?? "").toLowerCase().includes(normalizedSearch),
        );

      return matchesStatus && matchesSearch;
    });
  }, [payments, searchTerm, statusFilter]);

  const refreshPageData = async () => {
    applyPageData(await loadPaymentData());
  };

  const handleNavigation = (item) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  const focusForm = () => {
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const openAddForm = () => {
    setEditingPaymentId(null);
    setFormData(createInitialForm());
    setFormError("");

    if (searchParams.has("booking_id")) {
      navigate("/admin/payments", { replace: true });
    }
    setActionMessage(null);
    setShowForm(true);
    focusForm();
  };

  const openEditForm = (payment) => {
    setEditingPaymentId(payment.id);
    setFormData({
      booking_id: String(payment.booking_id),
      amount: String(payment.amount),
      payment_method: payment.payment_method,
      payment_status: payment.payment_status,
      transaction_reference: payment.transaction_reference || "",
    });
    setFormError("");
    setActionMessage(null);
    setShowForm(true);
    focusForm();
  };

  const closeForm = () => {
    if (isSaving) {
      return;
    }

    setShowForm(false);
    setEditingPaymentId(null);
    setFormData(createInitialForm());
    setFormError("");

    if (searchParams.has("booking_id")) {
      navigate("/admin/payments", { replace: true });
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentForm) => {
      const nextForm = { ...currentForm, [name]: value };

      if (name === "booking_id" && value) {
        const selectedBooking = eligibleBookings.find(
          (booking) => booking.b_id === Number(value),
        );

        if (selectedBooking?.car?.price) {
          nextForm.amount = String(selectedBooking.car.price);
        }
      }

      return nextForm;
    });
    setFormError("");
    setActionMessage(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isEditing = editingPaymentId !== null;

    try {
      setIsSaving(true);
      setFormError("");
      setActionMessage(null);

      const result = await requestJson(
        isEditing
          ? `${API_BASE_URL}/payments/${editingPaymentId}`
          : `${API_BASE_URL}/payments`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isEditing
              ? {
                  amount: Number(formData.amount),
                  payment_method: formData.payment_method,
                  transaction_reference:
                    formData.transaction_reference.trim() || null,
                }
              : {
                  booking_id: Number(formData.booking_id),
                  amount: Number(formData.amount),
                  payment_method: formData.payment_method,
                  payment_status: formData.payment_status,
                  transaction_reference:
                    formData.transaction_reference.trim() || null,
                },
          ),
        },
        "Unable to save the payment record.",
      );

      await refreshPageData();
      setShowForm(false);
      setEditingPaymentId(null);
      setFormData(createInitialForm());
      navigate("/admin/payments", { replace: true });
      setActionMessage({
        type: "success",
        text: result.message || "Payment record saved successfully.",
      });
    } catch (error) {
      console.error("Error saving payment:", error);
      setFormError(error.message || "Unable to save the payment record.");
    } finally {
      setIsSaving(false);
    }
  };

  const updatePaymentStatus = async (payment, newStatus) => {
    const actionLabel = newStatus === "paid" ? "mark as paid" : "refund";
    const confirmed = window.confirm(
      `${actionLabel === "refund" ? "Refund" : "Mark"} payment #PAY-${payment.id}${
        actionLabel === "mark as paid" ? " as paid" : ""
      }?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setBusyPaymentId(payment.id);
      setActionMessage(null);

      const result = await requestJson(
        `${API_BASE_URL}/payments/${payment.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payment_status: newStatus }),
        },
        `Unable to ${actionLabel} this payment.`,
      );

      await refreshPageData();
      setActionMessage({
        type: "success",
        text: result.message || "Payment status updated successfully.",
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      setActionMessage({
        type: "error",
        text: error.message || "Unable to update the payment status.",
      });
    } finally {
      setBusyPaymentId(null);
    }
  };

  const deletePayment = async (payment) => {
    const confirmed = window.confirm(
      `Delete payment #PAY-${payment.id}? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setBusyPaymentId(payment.id);
      setActionMessage(null);

      const result = await requestJson(
        `${API_BASE_URL}/payments/${payment.id}`,
        { method: "DELETE" },
        "Unable to delete this payment.",
      );

      if (editingPaymentId === payment.id) {
        closeForm();
      }

      await refreshPageData();
      setActionMessage({
        type: "success",
        text: result.message || "Payment record deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting payment:", error);
      setActionMessage({
        type: "error",
        text: error.message || "Unable to delete this payment.",
      });
    } finally {
      setBusyPaymentId(null);
    }
  };

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
                item.label === "Payments" ? "active" : ""
              } ${item.danger ? "danger-item" : ""}`}
              onClick={() => handleNavigation(item)}
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

      <main className="admin-main admin-payment-main">
        <header className="admin-header">
          <div>
            <h2>Payment Management</h2>
            <p>Record and track RideRent booking payments and refunds.</p>
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

        <section className="admin-payment-add-section">
          <div>
            <span className="admin-payment-kicker">Payment Setup</span>
            <h3>Create Booking Payment</h3>
            <p>
              Add a payment for a confirmed or completed booking that does not
              already have one.
            </p>
          </div>

          <button
            type="button"
            className="admin-payment-primary-button"
            disabled={eligibleBookings.length === 0}
            title={
              eligibleBookings.length === 0
                ? "No eligible booking is currently available"
                : "Create a payment record"
            }
            onClick={openAddForm}
          >
            <Plus size={18} />
            New Payment
          </button>
        </section>

        <section className="admin-payment-summary" aria-label="Payment summary">
          <article>
            <span>Total Records</span>
            <strong>{Number(summary.total_payments || 0)}</strong>
          </article>
          <article className="gold">
            <span>Pending</span>
            <strong>{Number(summary.pending_count || 0)}</strong>
          </article>
          <article>
            <span>Paid</span>
            <strong>{Number(summary.paid_count || 0)}</strong>
          </article>
          <article className="refund">
            <span>Refunded</span>
            <strong>{Number(summary.refunded_count || 0)}</strong>
          </article>
          <article className="amount-card">
            <span>Total Collected</span>
            <strong>৳{formatAmount(summary.total_collected)}</strong>
          </article>
        </section>

        {showForm && (
          <section
            ref={formRef}
            className="dashboard-card admin-payment-form-card"
          >
            <div className="admin-payment-form-header">
              <div>
                <span className="admin-payment-kicker">
                  {editingPaymentId ? "Update Record" : "New Record"}
                </span>
                <h3>
                  {editingPaymentId
                    ? `Edit Payment #PAY-${editingPaymentId}`
                    : "Payment Information"}
                </h3>
              </div>

              <button
                type="button"
                className="admin-payment-close-button"
                aria-label="Close payment form"
                disabled={isSaving}
                onClick={closeForm}
              >
                <X size={19} />
              </button>
            </div>

            <form className="admin-payment-form" onSubmit={handleSubmit}>
              <div className="admin-payment-field booking-field">
                <label htmlFor="payment-booking">Booking *</label>
                <select
                  id="payment-booking"
                  name="booking_id"
                  value={formData.booking_id}
                  required
                  disabled={editingPaymentId !== null}
                  onChange={handleFormChange}
                >
                  <option value="">Select an eligible booking</option>
                  {editingPaymentId && (
                    <option value={formData.booking_id}>
                      #BK-{formData.booking_id}
                    </option>
                  )}
                  {!editingPaymentId &&
                    eligibleBookings.map((booking) => (
                      <option key={booking.b_id} value={booking.b_id}>
                        #BK-{booking.b_id} — {booking.car?.name || "Vehicle"} —
                        User #{booking.u_id}
                      </option>
                    ))}
                </select>
              </div>

              <div className="admin-payment-field">
                <label htmlFor="payment-amount">Amount (BDT) *</label>
                <input
                  id="payment-amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  min="0.01"
                  max="99999999.99"
                  step="0.01"
                  placeholder="e.g. 3000"
                  required
                  onChange={handleFormChange}
                />
              </div>

              <div className="admin-payment-field">
                <label htmlFor="payment-method">Payment Method *</label>
                <select
                  id="payment-method"
                  name="payment_method"
                  value={formData.payment_method}
                  required
                  onChange={handleFormChange}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mobile_banking">Mobile Banking</option>
                </select>
              </div>

              {!editingPaymentId && (
                <div className="admin-payment-field">
                  <label htmlFor="payment-status">Initial Status *</label>
                  <select
                    id="payment-status"
                    name="payment_status"
                    value={formData.payment_status}
                    required
                    onChange={handleFormChange}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              )}

              <div className="admin-payment-field reference-field">
                <label htmlFor="payment-reference">
                  Transaction Reference
                </label>
                <input
                  id="payment-reference"
                  name="transaction_reference"
                  type="text"
                  value={formData.transaction_reference}
                  maxLength="100"
                  placeholder="Optional for cash payments"
                  onChange={handleFormChange}
                />
              </div>

              {formError && (
                <div className="admin-payment-form-error" role="alert">
                  {formError}
                </div>
              )}

              <div className="admin-payment-form-actions">
                <button
                  type="button"
                  className="secondary"
                  disabled={isSaving}
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-payment-primary-button"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : editingPaymentId
                      ? "Update Payment"
                      : "Create Payment"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="dashboard-card admin-payment-list-card">
          <div className="admin-payment-list-header">
            <div>
              <span className="admin-payment-kicker">Payment Records</span>
              <h3>Booking Payments</h3>
              <p>
                {loading
                  ? "Loading payment records..."
                  : `${filteredPayments.length} of ${payments.length} payment${
                      payments.length === 1 ? "" : "s"
                    } shown`}
              </p>
            </div>

            <div className="admin-payment-filters">
              <label className="admin-payment-search">
                <Search size={16} aria-hidden="true" />
                <span className="admin-payment-visually-hidden">
                  Search payments
                </span>
                <input
                  type="search"
                  value={searchTerm}
                  placeholder="Search booking, vehicle, reference..."
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>

              <label>
                <span className="admin-payment-visually-hidden">
                  Filter by payment status
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </label>
            </div>
          </div>

          {actionMessage && (
            <div
              className={`admin-payment-message ${actionMessage.type}`}
              role={actionMessage.type === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              {actionMessage.text}
            </div>
          )}

          <div className="admin-payment-table-wrapper">
            <table className="admin-payment-table">
              <thead>
                <tr>
                  <th>Payment</th>
                  <th>Booking & Vehicle</th>
                  <th>Driver</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="admin-payment-actions-heading">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr className="admin-payment-state-row">
                    <td colSpan="7" className="admin-payment-state-cell">
                      Loading payments...
                    </td>
                  </tr>
                )}

                {!loading && loadError && (
                  <tr className="admin-payment-state-row">
                    <td
                      colSpan="7"
                      className="admin-payment-state-cell error"
                    >
                      {loadError}
                    </td>
                  </tr>
                )}

                {!loading && !loadError && filteredPayments.length === 0 && (
                  <tr className="admin-payment-state-row">
                    <td colSpan="7" className="admin-payment-state-cell">
                      {payments.length === 0
                        ? "No payment records have been created yet."
                        : "No payments match the current search and filter."}
                    </td>
                  </tr>
                )}

                {!loading &&
                  !loadError &&
                  filteredPayments.map((payment) => {
                    const booking = payment.booking;
                    const isBusy = busyPaymentId === payment.id;

                    return (
                      <tr key={payment.id}>
                        <td data-label="Payment">
                          <div className="admin-payment-id-cell">
                            <strong>#PAY-{payment.id}</strong>
                            <span>
                              {payment.transaction_reference || "No reference"}
                            </span>
                            <small>{formatDateTime(payment.paid_at)}</small>
                          </div>
                        </td>

                        <td data-label="Booking & Vehicle">
                          <div className="admin-payment-booking-cell">
                            <strong>#BK-{booking?.b_id || payment.booking_id}</strong>
                            <span>{booking?.car?.name || "Unknown Vehicle"}</span>
                            <small>User #{booking?.u_id || "—"}</small>
                          </div>
                        </td>

                        <td data-label="Driver">
                          <div className="admin-payment-driver-cell">
                            <strong>{booking?.driver?.name || "Unassigned"}</strong>
                            <span>{booking?.driver?.phone || "No driver phone"}</span>
                          </div>
                        </td>

                        <td data-label="Method">
                          <span className="admin-payment-method">
                            <MethodIcon method={payment.payment_method} />
                            {formatMethod(payment.payment_method)}
                          </span>
                        </td>

                        <td data-label="Amount">
                          <strong className="admin-payment-amount">
                            ৳{formatAmount(payment.amount)}
                          </strong>
                        </td>

                        <td data-label="Status">
                          <span
                            className={`admin-payment-status ${payment.payment_status}`}
                          >
                            {payment.payment_status}
                          </span>
                        </td>

                        <td
                          data-label="Actions"
                          className="admin-payment-actions-cell"
                        >
                          <div className="admin-payment-row-actions">
                            {payment.payment_status === "pending" && (
                              <>
                                <button
                                  type="button"
                                  className="edit"
                                  disabled={isBusy || isSaving}
                                  onClick={() => openEditForm(payment)}
                                >
                                  <Pencil size={15} />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="primary"
                                  disabled={isBusy}
                                  onClick={() =>
                                    updatePaymentStatus(payment, "paid")
                                  }
                                >
                                  <CheckCircle2 size={15} />
                                  {isBusy ? "Updating..." : "Mark Paid"}
                                </button>
                              </>
                            )}

                            {payment.payment_status === "paid" && (
                              <button
                                type="button"
                                className="refund"
                                disabled={isBusy}
                                onClick={() =>
                                  updatePaymentStatus(payment, "refunded")
                                }
                              >
                                <RotateCcw size={15} />
                                {isBusy ? "Updating..." : "Refund"}
                              </button>
                            )}

                            <button
                              type="button"
                              className="delete"
                              disabled={isBusy || isSaving}
                              onClick={() => deletePayment(payment)}
                            >
                              <Trash2 size={15} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminPaymentsPage;
