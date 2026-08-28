import {
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/admin-dashboard.css";
import "../styles/admin-drivers-page.css";

const API_URL = "http://localhost:8000/api/drivers";

const navItems = [
  { label: "Dashboard", icon: "▦", path: "/admin" },
  { label: "Manage Users", icon: "♙" },
  { label: "Vehicles", icon: "▱", path: "/admin/admin-vehicle" },
  { label: "Drivers", icon: "♧", path: "/admin/drivers" },
  { label: "Bookings", icon: "▣", path: "/admin/bookings" },
  { label: "Payments", icon: "৳" },
  { label: "Ambulance / Emergency", icon: "✚", danger: true },
  { label: "Reviews", icon: "☆" },
  { label: "Reports", icon: "▥" },
];

const createInitialFormData = () => ({
  name: "",
  phone: "",
  license_number: "",
  experience_years: "",
  status: "available",
});

const sortDrivers = (drivers) =>
  [...drivers].sort((firstDriver, secondDriver) =>
    firstDriver.name.localeCompare(secondDriver.name),
  );

const getApiErrorMessage = (result, fallbackMessage) => {
  const validationMessage = result?.errors
    ? Object.values(result.errors).flat()[0]
    : null;

  return validationMessage || result?.message || fallbackMessage;
};

function AdminDriversPage() {
  const navigate = useNavigate();
  const formSectionRef = useRef(null);

  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [formData, setFormData] = useState(createInitialFormData);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingDriverId, setDeletingDriverId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchDrivers = async () => {
      try {
        setLoadingDrivers(true);
        setLoadError("");

        const response = await fetch(API_URL, {
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(result, "Unable to load drivers."),
          );
        }

        const driverRecords = Array.isArray(result)
          ? result
          : result.drivers;

        setDrivers(
          sortDrivers(Array.isArray(driverRecords) ? driverRecords : []),
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error loading drivers:", error);
          setLoadError(error.message || "Unable to load drivers.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingDrivers(false);
        }
      }
    };

    fetchDrivers();

    return () => controller.abort();
  }, []);

  const driverStats = useMemo(
    () => ({
      total: drivers.length,
      available: drivers.filter((driver) => driver.status === "available")
        .length,
      busy: drivers.filter((driver) => driver.status === "busy").length,
      inactive: drivers.filter((driver) => driver.status === "inactive")
        .length,
    }),
    [drivers],
  );

  const filteredDrivers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return drivers.filter((driver) => {
      const matchesStatus =
        statusFilter === "all" || driver.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        driver.name.toLowerCase().includes(normalizedSearch) ||
        driver.phone.toLowerCase().includes(normalizedSearch) ||
        driver.license_number.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [drivers, searchTerm, statusFilter]);

  const handleNavigation = (item) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  const focusForm = () => {
    window.requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const openAddForm = () => {
    setEditingDriverId(null);
    setFormData(createInitialFormData());
    setFormError("");
    setActionMessage(null);
    setShowForm(true);
    focusForm();
  };

  const openEditForm = (driver) => {
    setEditingDriverId(driver.id);
    setFormData({
      name: driver.name,
      phone: driver.phone,
      license_number: driver.license_number,
      experience_years: String(driver.experience_years),
      status: driver.status,
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
    setEditingDriverId(null);
    setFormData(createInitialFormData());
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
    setFormError("");
    setActionMessage(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setActionMessage(null);

    const isEditing = editingDriverId !== null;
    const requestUrl = isEditing
      ? `${API_URL}/${editingDriverId}`
      : API_URL;

    try {
      setIsSaving(true);

      const response = await fetch(requestUrl, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ...formData,
          experience_years: Number(formData.experience_years),
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(result, "Unable to save the driver."),
        );
      }

      if (isEditing) {
        setDrivers((currentDrivers) =>
          sortDrivers(
            currentDrivers.map((driver) =>
              driver.id === editingDriverId ? result.driver : driver,
            ),
          ),
        );
      } else {
        setDrivers((currentDrivers) =>
          sortDrivers([...currentDrivers, result.driver]),
        );
      }

      setActionMessage({
        type: "success",
        text:
          result.message ||
          `Driver ${isEditing ? "updated" : "added"} successfully.`,
      });
      setShowForm(false);
      setEditingDriverId(null);
      setFormData(createInitialFormData());
    } catch (error) {
      console.error("Error saving driver:", error);
      setFormError(error.message || "Unable to save the driver.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (driver) => {
    const confirmed = window.confirm(
      `Delete ${driver.name}? This will permanently remove the driver record.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingDriverId(driver.id);
      setActionMessage(null);

      const response = await fetch(`${API_URL}/${driver.id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(result, "Unable to delete the driver."),
        );
      }

      setDrivers((currentDrivers) =>
        currentDrivers.filter(
          (currentDriver) => currentDriver.id !== driver.id,
        ),
      );

      if (editingDriverId === driver.id) {
        closeForm();
      }

      setActionMessage({
        type: "success",
        text: result.message || "Driver deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting driver:", error);
      setActionMessage({
        type: "error",
        text: error.message || "Unable to delete the driver.",
      });
    } finally {
      setDeletingDriverId(null);
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
                item.label === "Drivers" ? "active" : ""
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

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h2>Driver Management</h2>
            <p>Manage RideRent driver records and operational availability.</p>
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

        <section className="admin-driver-add-section">
          <div className="admin-driver-add-copy">
            <span className="admin-driver-section-kicker">Driver Setup</span>
            <h3>Add New Driver</h3>
            <p>
              Create and maintain verified driver records for future trip
              assignments.
            </p>
          </div>

          <button
            type="button"
            className="admin-driver-primary-button"
            onClick={openAddForm}
          >
            <Plus size={18} />
            Add New Driver
          </button>
        </section>

        <section className="admin-driver-stats-grid" aria-label="Driver summary">
          <article className="admin-driver-stat-card">
            <span>Total Drivers</span>
            <strong>{driverStats.total}</strong>
          </article>
          <article className="admin-driver-stat-card available">
            <span>Available</span>
            <strong>{driverStats.available}</strong>
          </article>
          <article className="admin-driver-stat-card busy">
            <span>Busy</span>
            <strong>{driverStats.busy}</strong>
          </article>
          <article className="admin-driver-stat-card inactive">
            <span>Inactive</span>
            <strong>{driverStats.inactive}</strong>
          </article>
        </section>

        {showForm && (
          <section
            ref={formSectionRef}
            className="dashboard-card admin-driver-form-card"
          >
            <div className="admin-driver-form-header">
              <div>
                <span className="admin-driver-section-kicker">
                  {editingDriverId ? "Update Record" : "New Record"}
                </span>
                <h3>{editingDriverId ? "Edit Driver" : "Driver Information"}</h3>
              </div>

              <button
                type="button"
                className="admin-driver-close-button"
                aria-label="Close driver form"
                disabled={isSaving}
                onClick={closeForm}
              >
                <X size={19} />
              </button>
            </div>

            <form className="admin-driver-form" onSubmit={handleSubmit}>
              <div className="admin-driver-field">
                <label htmlFor="driver-name">Driver Name *</label>
                <input
                  id="driver-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  maxLength="255"
                  placeholder="e.g. Rahim Ahmed"
                  required
                  onChange={handleFormChange}
                />
              </div>

              <div className="admin-driver-field">
                <label htmlFor="driver-phone">Phone Number *</label>
                <input
                  id="driver-phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  maxLength="20"
                  placeholder="e.g. 01712345678"
                  required
                  onChange={handleFormChange}
                />
              </div>

              <div className="admin-driver-field">
                <label htmlFor="driver-license">License Number *</label>
                <input
                  id="driver-license"
                  name="license_number"
                  type="text"
                  value={formData.license_number}
                  maxLength="100"
                  placeholder="e.g. DL-DHA-123456"
                  required
                  onChange={handleFormChange}
                />
              </div>

              <div className="admin-driver-field">
                <label htmlFor="driver-experience">Experience (Years) *</label>
                <input
                  id="driver-experience"
                  name="experience_years"
                  type="number"
                  value={formData.experience_years}
                  min="0"
                  max="60"
                  placeholder="e.g. 5"
                  required
                  onChange={handleFormChange}
                />
              </div>

              <div className="admin-driver-field admin-driver-status-field">
                <label htmlFor="driver-status">Status *</label>
                <select
                  id="driver-status"
                  name="status"
                  value={formData.status}
                  required
                  onChange={handleFormChange}
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {formError && (
                <div className="admin-driver-form-error" role="alert">
                  {formError}
                </div>
              )}

              <div className="admin-driver-form-actions">
                <button
                  type="button"
                  className="admin-driver-secondary-button"
                  disabled={isSaving}
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-driver-primary-button"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : editingDriverId
                      ? "Update Driver"
                      : "Save Driver"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="dashboard-card admin-driver-list-card">
          <div className="admin-driver-list-header">
            <div>
              <span className="admin-driver-section-kicker">Driver Records</span>
              <h3>Existing Drivers</h3>
              <p>
                {loadingDrivers
                  ? "Loading driver records..."
                  : `${drivers.length} driver${drivers.length === 1 ? "" : "s"} in the system`}
              </p>
            </div>

            <div className="admin-driver-filters">
              <label className="admin-driver-search">
                <Search size={16} aria-hidden="true" />
                <span className="admin-driver-visually-hidden">Search drivers</span>
                <input
                  type="search"
                  value={searchTerm}
                  placeholder="Search drivers..."
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>

              <label>
                <span className="admin-driver-visually-hidden">Filter by status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
          </div>

          {actionMessage && (
            <div
              className={`admin-driver-action-message ${actionMessage.type}`}
              role={actionMessage.type === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              {actionMessage.text}
            </div>
          )}

          <div className="admin-driver-table-wrapper">
            <table className="admin-driver-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Phone</th>
                  <th>License Number</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th className="admin-driver-actions-heading">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loadingDrivers && (
                  <tr className="admin-driver-state-row">
                    <td colSpan="6" className="admin-driver-state-cell">
                      Loading drivers...
                    </td>
                  </tr>
                )}

                {!loadingDrivers && loadError && (
                  <tr className="admin-driver-state-row">
                    <td
                      colSpan="6"
                      className="admin-driver-state-cell admin-driver-error-cell"
                    >
                      {loadError}
                    </td>
                  </tr>
                )}

                {!loadingDrivers &&
                  !loadError &&
                  filteredDrivers.length === 0 && (
                    <tr className="admin-driver-state-row">
                      <td colSpan="6" className="admin-driver-state-cell">
                        {drivers.length === 0
                          ? "No drivers have been added yet."
                          : "No drivers match the current search and filter."}
                      </td>
                    </tr>
                  )}

                {!loadingDrivers &&
                  !loadError &&
                  filteredDrivers.map((driver) => (
                    <tr key={driver.id}>
                      <td data-label="Driver" className="admin-driver-main-cell">
                        <div className="admin-driver-name-cell">
                          <span className="admin-driver-avatar">
                            <UserRound size={19} />
                          </span>
                          <span>
                            <strong>{driver.name}</strong>
                            <small>ID #{driver.id}</small>
                          </span>
                        </div>
                      </td>
                      <td data-label="Phone">{driver.phone}</td>
                      <td data-label="License Number">
                        <span className="admin-driver-license">
                          {driver.license_number}
                        </span>
                      </td>
                      <td data-label="Experience">
                        {driver.experience_years} year
                        {driver.experience_years === 1 ? "" : "s"}
                      </td>
                      <td data-label="Status">
                        <span
                          className={`admin-driver-status ${driver.status}`}
                        >
                          {driver.status}
                        </span>
                      </td>
                      <td data-label="Actions" className="admin-driver-actions-cell">
                        <div className="admin-driver-row-actions">
                          <button
                            type="button"
                            className="admin-driver-action-button edit"
                            aria-label={`Edit ${driver.name}`}
                            onClick={() => openEditForm(driver)}
                          >
                            <Pencil size={15} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            className="admin-driver-action-button delete"
                            aria-label={`Delete ${driver.name}`}
                            aria-busy={deletingDriverId === driver.id}
                            disabled={deletingDriverId !== null || isSaving}
                            onClick={() => handleDelete(driver)}
                          >
                            <Trash2 size={15} />
                            <span>
                              {deletingDriverId === driver.id
                                ? "Deleting..."
                                : "Delete"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDriversPage;
