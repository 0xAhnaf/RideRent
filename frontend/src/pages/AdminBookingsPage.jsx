import {
  CalendarClock,
  Check,
  Flag,
  MapPin,
  Search,
  Trash2,
  UserRound,
  UserRoundCheck,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/admin-dashboard.css";
import "../styles/admin-bookings-page.css";

const API_BASE_URL = "http://localhost:8000/api";
const CLOSED_STATUSES = ["Completed", "Cancelled"];

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

const getApiErrorMessage = (result, fallbackMessage) => {
  const validationMessage = result?.errors
    ? Object.values(result.errors).flat()[0]
    : null;

  return validationMessage || result?.message || fallbackMessage;
};

const formatTripDate = (dateValue) => {
  if (!dateValue) {
    return "Date unavailable";
  }

  const parsedDate = new Date(String(dateValue).replace(" ", "T"));

  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
};

const formatPaymentAmount = (amount) =>
  new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

function AdminBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [driverSelections, setDriverSelections] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyBookingId, setBusyBookingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const replaceBooking = (updatedBooking) => {
    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.b_id === updatedBooking.b_id ? updatedBooking : booking,
      ),
    );
    setDriverSelections((currentSelections) => ({
      ...currentSelections,
      [updatedBooking.b_id]: updatedBooking.driver_id
        ? String(updatedBooking.driver_id)
        : "",
    }));
  };

  const fetchDrivers = async () => {
    const response = await fetch(`${API_BASE_URL}/drivers`, {
      headers: { Accept: "application/json" },
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(getApiErrorMessage(result, "Unable to load drivers."));
    }

    const driverRecords = Array.isArray(result) ? result : result.drivers;
    setDrivers(Array.isArray(driverRecords) ? driverRecords : []);
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadPageData = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const [bookingsResponse, driversResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/bookings`, {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          }),
          fetch(`${API_BASE_URL}/drivers`, {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          }),
        ]);

        const [bookingsResult, driversResult] = await Promise.all([
          bookingsResponse.json().catch(() => ({})),
          driversResponse.json().catch(() => ({})),
        ]);

        if (!bookingsResponse.ok) {
          throw new Error(
            getApiErrorMessage(bookingsResult, "Unable to load bookings."),
          );
        }

        if (!driversResponse.ok) {
          throw new Error(
            getApiErrorMessage(driversResult, "Unable to load drivers."),
          );
        }

        const bookingRecords = Array.isArray(bookingsResult)
          ? bookingsResult
          : bookingsResult.bookings;
        const driverRecords = Array.isArray(driversResult)
          ? driversResult
          : driversResult.drivers;
        const safeBookings = Array.isArray(bookingRecords) ? bookingRecords : [];

        setBookings(safeBookings);
        setDrivers(Array.isArray(driverRecords) ? driverRecords : []);
        setDriverSelections(
          Object.fromEntries(
            safeBookings.map((booking) => [
              booking.b_id,
              booking.driver_id ? String(booking.driver_id) : "",
            ]),
          ),
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error loading booking management data:", error);
          setLoadError(error.message || "Unable to load booking records.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadPageData();

    return () => controller.abort();
  }, []);

  const bookingStats = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter(
        (booking) => booking.booking_status === "Pending",
      ).length,
      confirmed: bookings.filter(
        (booking) => booking.booking_status === "Confirmed",
      ).length,
      completed: bookings.filter(
        (booking) => booking.booking_status === "Completed",
      ).length,
      unassigned: bookings.filter(
        (booking) =>
          !booking.driver_id &&
          !CLOSED_STATUSES.includes(booking.booking_status),
      ).length,
    }),
    [bookings],
  );

  const filteredBookings = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesStatus =
        statusFilter === "all" || booking.booking_status === statusFilter;
      const searchableValues = [
        booking.b_id,
        booking.u_id,
        booking.car?.name,
        booking.driver?.name,
        booking.payment?.payment_status,
        booking.payment?.transaction_reference,
        booking.pickup,
        booking.destination,
        booking.trip_type,
      ];
      const matchesSearch =
        !normalizedSearch ||
        searchableValues.some((value) =>
          String(value ?? "").toLowerCase().includes(normalizedSearch),
        );

      return matchesStatus && matchesSearch;
    });
  }, [bookings, searchTerm, statusFilter]);

  const handleNavigation = (item) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  const handleDriverSelection = (bookingId, driverId) => {
    setDriverSelections((currentSelections) => ({
      ...currentSelections,
      [bookingId]: driverId,
    }));
    setActionMessage(null);
  };

  const getDriverOptions = (booking) =>
    drivers.filter(
      (driver) =>
        driver.status === "available" || driver.id === booking.driver_id,
    );

  const saveDriverAssignment = async (booking) => {
    const selectedDriverId = driverSelections[booking.b_id] || "";
    const isUnassigning = selectedDriverId === "";
    const endpoint = `${API_BASE_URL}/bookings/${booking.b_id}/driver`;

    if (!isUnassigning && Number(selectedDriverId) === booking.driver_id) {
      return;
    }

    try {
      setBusyBookingId(booking.b_id);
      setActionMessage(null);

      const response = await fetch(endpoint, {
        method: isUnassigning ? "DELETE" : "PUT",
        headers: {
          Accept: "application/json",
          ...(isUnassigning ? {} : { "Content-Type": "application/json" }),
        },
        ...(isUnassigning
          ? {}
          : { body: JSON.stringify({ driver_id: Number(selectedDriverId) }) }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(result, "Unable to update the driver assignment."),
        );
      }

      replaceBooking(result.booking);
      await fetchDrivers();
      setActionMessage({
        type: "success",
        text: result.message || "Driver assignment updated successfully.",
      });
    } catch (error) {
      console.error("Error updating driver assignment:", error);
      setDriverSelections((currentSelections) => ({
        ...currentSelections,
        [booking.b_id]: booking.driver_id ? String(booking.driver_id) : "",
      }));
      setActionMessage({
        type: "error",
        text: error.message || "Unable to update the driver assignment.",
      });
    } finally {
      setBusyBookingId(null);
    }
  };

  const updateBookingStatus = async (booking, newStatus) => {
    try {
      setBusyBookingId(booking.b_id);
      setActionMessage(null);

      const response = await fetch(
        `${API_BASE_URL}/bookings/${booking.b_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ booking_status: newStatus }),
        },
      );
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(result, "Unable to update the booking status."),
        );
      }

      replaceBooking(result.booking);
      await fetchDrivers();
      setActionMessage({
        type: "success",
        text: result.message || "Booking status updated successfully.",
      });
    } catch (error) {
      console.error("Error updating booking status:", error);
      setActionMessage({
        type: "error",
        text: error.message || "Unable to update the booking status.",
      });
    } finally {
      setBusyBookingId(null);
    }
  };

  const deleteBooking = async (booking) => {
    const confirmed = window.confirm(
      `Delete booking #BK-${booking.b_id}? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setBusyBookingId(booking.b_id);
      setActionMessage(null);

      const response = await fetch(
        `${API_BASE_URL}/bookings/${booking.b_id}`,
        {
          method: "DELETE",
          headers: { Accept: "application/json" },
        },
      );
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(getApiErrorMessage(result, "Unable to delete booking."));
      }

      setBookings((currentBookings) =>
        currentBookings.filter(
          (currentBooking) => currentBooking.b_id !== booking.b_id,
        ),
      );
      setDriverSelections((currentSelections) => {
        const nextSelections = { ...currentSelections };
        delete nextSelections[booking.b_id];
        return nextSelections;
      });
      await fetchDrivers();
      setActionMessage({
        type: "success",
        text: result.message || "Booking deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting booking:", error);
      setActionMessage({
        type: "error",
        text: error.message || "Unable to delete booking.",
      });
    } finally {
      setBusyBookingId(null);
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
                item.label === "Bookings" ? "active" : ""
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

      <main className="admin-main admin-booking-main">
        <header className="admin-header">
          <div>
            <h2>Booking Management</h2>
            <p>Assign drivers and manage every booking through its trip flow.</p>
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

        <section className="admin-booking-summary" aria-label="Booking summary">
          <article>
            <span>Total Bookings</span>
            <strong>{bookingStats.total}</strong>
          </article>
          <article className="gold">
            <span>Pending</span>
            <strong>{bookingStats.pending}</strong>
          </article>
          <article>
            <span>Confirmed</span>
            <strong>{bookingStats.confirmed}</strong>
          </article>
          <article>
            <span>Completed</span>
            <strong>{bookingStats.completed}</strong>
          </article>
          <article className={bookingStats.unassigned ? "attention" : ""}>
            <span>Need Driver</span>
            <strong>{bookingStats.unassigned}</strong>
          </article>
        </section>

        <section className="dashboard-card admin-booking-list-card">
          <div className="admin-booking-list-header">
            <div>
              <span className="admin-booking-kicker">Dispatch Records</span>
              <h3>Bookings & Driver Assignment</h3>
              <p>
                {loading
                  ? "Loading booking records..."
                  : `${filteredBookings.length} of ${bookings.length} booking${
                      bookings.length === 1 ? "" : "s"
                    } shown`}
              </p>
            </div>

            <div className="admin-booking-filters">
              <label className="admin-booking-search">
                <Search size={16} aria-hidden="true" />
                <span className="admin-booking-visually-hidden">
                  Search bookings
                </span>
                <input
                  type="search"
                  value={searchTerm}
                  placeholder="Search booking, route, driver..."
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>

              <label>
                <span className="admin-booking-visually-hidden">
                  Filter by booking status
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </label>
            </div>
          </div>

          {actionMessage && (
            <div
              className={`admin-booking-message ${actionMessage.type}`}
              role={actionMessage.type === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              {actionMessage.text}
            </div>
          )}

          <div className="admin-booking-table-wrapper">
            <table className="admin-booking-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Vehicle & Trip</th>
                  <th>Route</th>
                  <th>Driver Assignment</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="admin-booking-actions-heading">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr className="admin-booking-state-row">
                    <td colSpan="7" className="admin-booking-state-cell">
                      Loading bookings and drivers...
                    </td>
                  </tr>
                )}

                {!loading && loadError && (
                  <tr className="admin-booking-state-row">
                    <td
                      colSpan="7"
                      className="admin-booking-state-cell error"
                    >
                      {loadError}
                    </td>
                  </tr>
                )}

                {!loading && !loadError && filteredBookings.length === 0 && (
                  <tr className="admin-booking-state-row">
                    <td colSpan="7" className="admin-booking-state-cell">
                      {bookings.length === 0
                        ? "No bookings have been created yet."
                        : "No bookings match the current search and filter."}
                    </td>
                  </tr>
                )}

                {!loading &&
                  !loadError &&
                  filteredBookings.map((booking) => {
                    const isClosed = CLOSED_STATUSES.includes(
                      booking.booking_status,
                    );
                    const selectedDriverId =
                      driverSelections[booking.b_id] || "";
                    const selectionIsSaved =
                      Number(selectedDriverId) === booking.driver_id ||
                      (!selectedDriverId && !booking.driver_id);
                    const isBusy = busyBookingId === booking.b_id;

                    return (
                      <tr key={booking.b_id}>
                        <td data-label="Booking">
                          <div className="admin-booking-id-cell">
                            <strong>#BK-{booking.b_id}</strong>
                            <span>User #{booking.u_id}</span>
                            <small>
                              <CalendarClock size={13} />
                              {formatTripDate(booking.trip_datetime)}
                            </small>
                          </div>
                        </td>

                        <td data-label="Vehicle & Trip">
                          <div className="admin-booking-trip-cell">
                            <strong>{booking.car?.name || "Unknown Vehicle"}</strong>
                            <span>{booking.trip_type}</span>
                            <small>{booking.trip_duration}</small>
                          </div>
                        </td>

                        <td data-label="Route">
                          <div className="admin-booking-route-cell">
                            <span>
                              <MapPin size={14} />
                              {booking.pickup}
                            </span>
                            <span className="route-line" aria-hidden="true" />
                            <span>
                              <Flag size={14} />
                              {booking.destination}
                            </span>
                          </div>
                        </td>

                        <td data-label="Driver Assignment">
                          <div className="admin-booking-driver-cell">
                            <div className="admin-booking-current-driver">
                              {booking.driver ? (
                                <>
                                  <UserRoundCheck size={16} />
                                  <span>
                                    <strong>{booking.driver.name}</strong>
                                    <small>{booking.driver.phone}</small>
                                  </span>
                                </>
                              ) : (
                                <>
                                  <UserRound size={16} />
                                  <span>
                                    <strong>Unassigned</strong>
                                    <small>Select an available driver</small>
                                  </span>
                                </>
                              )}
                            </div>

                            {!isClosed && (
                              <div className="admin-booking-assignment-controls">
                                <select
                                  value={selectedDriverId}
                                  aria-label={`Driver for booking ${booking.b_id}`}
                                  disabled={isBusy}
                                  onChange={(event) =>
                                    handleDriverSelection(
                                      booking.b_id,
                                      event.target.value,
                                    )
                                  }
                                >
                                  <option
                                    value=""
                                    disabled={
                                      booking.booking_status === "Confirmed" &&
                                      Boolean(booking.payment)
                                    }
                                  >
                                    No driver
                                  </option>
                                  {getDriverOptions(booking).map((driver) => (
                                    <option key={driver.id} value={driver.id}>
                                      {driver.name}
                                      {driver.id === booking.driver_id
                                        ? " (assigned)"
                                        : ""}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  type="button"
                                  disabled={isBusy || selectionIsSaved}
                                  onClick={() => saveDriverAssignment(booking)}
                                >
                                  {isBusy
                                    ? "Saving..."
                                    : !selectedDriverId
                                      ? "Unassign"
                                      : booking.driver_id
                                        ? "Reassign"
                                        : "Assign"}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        <td data-label="Payment">
                          <div className="admin-booking-payment-cell">
                            {booking.payment ? (
                              <>
                                <span
                                  className={`admin-booking-payment-status ${booking.payment.payment_status}`}
                                >
                                  {booking.payment.payment_status}
                                </span>
                                <strong>
                                  ৳{formatPaymentAmount(booking.payment.amount)}
                                </strong>
                                <small>
                                  {booking.payment.transaction_reference ||
                                    "No transaction reference"}
                                </small>
                              </>
                            ) : (
                              <>
                                <span className="admin-booking-payment-empty">
                                  Not recorded
                                </span>
                                {["Confirmed", "Completed"].includes(
                                  booking.booking_status,
                                ) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate(
                                        `/admin/payments?booking_id=${booking.b_id}`,
                                      )
                                    }
                                  >
                                    Create Payment
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>

                        <td data-label="Status">
                          <span
                            className={`admin-booking-status ${booking.booking_status.toLowerCase()}`}
                          >
                            {booking.booking_status}
                          </span>
                        </td>

                        <td
                          data-label="Actions"
                          className="admin-booking-actions-cell"
                        >
                          <div className="admin-booking-row-actions">
                            {booking.booking_status === "Pending" && (
                              <button
                                type="button"
                                className="primary"
                                disabled={isBusy || !booking.driver_id}
                                title={
                                  booking.driver_id
                                    ? "Confirm booking"
                                    : "Assign a driver before confirming"
                                }
                                onClick={() =>
                                  updateBookingStatus(booking, "Confirmed")
                                }
                              >
                                <Check size={15} />
                                Confirm
                              </button>
                            )}

                            {booking.booking_status === "Confirmed" && (
                              <button
                                type="button"
                                className="primary"
                                disabled={isBusy}
                                onClick={() =>
                                  updateBookingStatus(booking, "Completed")
                                }
                              >
                                <Flag size={15} />
                                Complete
                              </button>
                            )}

                            {!isClosed && (
                              <button
                                type="button"
                                className="danger"
                                disabled={isBusy}
                                onClick={() =>
                                  updateBookingStatus(booking, "Cancelled")
                                }
                              >
                                <XCircle size={15} />
                                Cancel
                              </button>
                            )}

                            {!booking.payment && (
                              <button
                                type="button"
                                className="danger outline"
                                disabled={isBusy}
                                onClick={() => deleteBooking(booking)}
                              >
                                <Trash2 size={15} />
                                Delete
                              </button>
                            )}
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

export default AdminBookingsPage;
