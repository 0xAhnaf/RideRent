import { CarFront, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/admin-dashboard.css";
import "../styles/admin-vehicles-page.css";

const navItems = [
  { label: "Dashboard", icon: "▦", path: "/admin" },
  { label: "Manage Users", icon: "♙" },
  { label: "Vehicles", icon: "▱", path: "/admin/admin-vehicle" },
  { label: "Drivers", icon: "♧" },
  { label: "Bookings", icon: "▣" },
  { label: "Payments", icon: "৳" },
  { label: "Ambulance / Emergency", icon: "✚", danger: true },
  { label: "Reviews", icon: "☆" },
  { label: "Reports", icon: "▥" },
];

function AdminVehicleImage({ car }) {
  const [imageError, setImageError] = useState(false);
  const imageSource = car.image_url || null;

  useEffect(() => {
    setImageError(false);
  }, [imageSource]);

  if (!imageSource || imageError) {
    return (
      <div className="admin-vehicle-image-fallback" aria-label="Vehicle image unavailable">
        <CarFront size={24} />
      </div>
    );
  }

  return (
    <img
      src={imageSource}
      alt={car.name}
      className="admin-vehicle-table-image"
      onError={() => setImageError(true)}
    />
  );
}

function AdminVehiclesPage() {
  const navigate = useNavigate();

  const [cars, setCars] = useState([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [carsError, setCarsError] = useState("");
  const [deletingCarId, setDeletingCarId] = useState(null);
  const [vehicleActionMessage, setVehicleActionMessage] = useState(null);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoadingCars(true);
        setCarsError("");

        const response = await fetch("http://localhost:8000/api/cars");

        if (!response.ok) {
          throw new Error("Failed to fetch vehicles.");
        }

        const data = await response.json();
        setCars(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        setCarsError("Unable to load vehicles right now.");
      } finally {
        setLoadingCars(false);
      }
    };

    fetchCars();
  }, []);

  const handleNavigation = (item) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  const handleDeleteVehicle = async (car) => {
    const confirmed = window.confirm(
      `Delete ${car.name}? This will permanently remove the vehicle and its stored image.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingCarId(car.id);
      setVehicleActionMessage(null);

      const response = await fetch(
        `http://localhost:8000/api/cars/${car.id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to delete the vehicle.",
        );
      }

      setCars((currentCars) =>
        currentCars.filter((currentCar) => currentCar.id !== car.id),
      );
      setVehicleActionMessage({
        type: "success",
        text: result.message || `${car.name} was deleted successfully.`,
      });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      setVehicleActionMessage({
        type: "error",
        text: error.message || "Unable to delete the vehicle.",
      });
    } finally {
      setDeletingCarId(null);
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
                item.label === "Vehicles" ? "active" : ""
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
            <h2>Vehicle Management</h2>
            <p>Manage RideRent vehicle information and fleet availability.</p>
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

        <section className="admin-vehicle-add-section">
          <div className="admin-vehicle-add-copy">
            <span className="admin-vehicle-section-kicker">Fleet Setup</span>
            <h3>Add New Vehicle</h3>
            <p>
              Add a new car or other supported vehicle to the RideRent fleet.
            </p>
          </div>

          <button
            type="button"
            className="admin-vehicle-primary-button"
            onClick={() => navigate("/admin/add-vehicle")}
          >
            <Plus size={18} />
            Add New Vehicle
          </button>
        </section>

        <section className="dashboard-card admin-vehicle-list-card">
          <div className="card-header admin-vehicle-list-header">
            <div>
              <span className="admin-vehicle-section-kicker">Fleet Records</span>
              <h3>Existing Vehicles</h3>
              <p>
                {loadingCars
                  ? "Loading vehicle records..."
                  : `${cars.length} vehicle model${cars.length === 1 ? "" : "s"} in the system`}
              </p>
            </div>
          </div>

          {vehicleActionMessage && (
            <div
              className={`admin-vehicle-action-message ${vehicleActionMessage.type}`}
              role={
                vehicleActionMessage.type === "error" ? "alert" : "status"
              }
              aria-live="polite"
            >
              {vehicleActionMessage.text}
            </div>
          )}

          <div className="admin-vehicle-table-wrapper">
            <table className="admin-vehicle-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Seats</th>
                  <th>Quantity</th>
                  <th>Price / Day</th>
                  <th>Status</th>
                  <th className="admin-vehicle-actions-heading">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loadingCars && (
                  <tr className="admin-vehicle-state-row">
                    <td colSpan="8" className="admin-vehicle-state-cell">
                      Loading vehicles...
                    </td>
                  </tr>
                )}

                {!loadingCars && carsError && (
                  <tr className="admin-vehicle-state-row">
                    <td
                      colSpan="8"
                      className="admin-vehicle-state-cell admin-vehicle-error-cell"
                    >
                      {carsError}
                    </td>
                  </tr>
                )}

                {!loadingCars && !carsError && cars.length === 0 && (
                  <tr className="admin-vehicle-state-row">
                    <td colSpan="8" className="admin-vehicle-state-cell">
                      No vehicles found.
                    </td>
                  </tr>
                )}

                {!loadingCars &&
                  !carsError &&
                  cars.map((car) => (
                    <tr key={car.id}>
                      <td data-label="Vehicle" className="admin-vehicle-main-cell">
                        <div className="admin-vehicle-name-cell">
                          <div className="admin-vehicle-image-shell">
                            <AdminVehicleImage car={car} />
                          </div>

                          <div>
                            <strong>{car.name}</strong>
                            <span>ID #{car.id}</span>
                          </div>
                        </div>
                      </td>

                      <td data-label="Brand">{car.brand}</td>
                      <td data-label="Category">{car.category}</td>
                      <td data-label="Seats">{car.seats}</td>
                      <td data-label="Quantity">{car.quantity}</td>
                      <td data-label="Price / Day">
                        ৳{Number(car.price).toLocaleString()}
                      </td>

                      <td data-label="Status">
                        <span
                          className={`admin-vehicle-status ${
                            car.status === "available"
                              ? "available"
                              : "unavailable"
                          }`}
                        >
                          {car.status}
                        </span>
                      </td>

                      <td data-label="Actions" className="admin-vehicle-actions-cell">
                        <div className="admin-vehicle-row-actions">
                          <button
                            type="button"
                            className="admin-vehicle-action-button edit"
                            title="Edit vehicle"
                            aria-label={`Edit ${car.name}`}
                            onClick={() =>
                              navigate(`/admin/edit-vehicle/${car.id}`)
                            }
                          >
                            <Pencil size={16} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            className="admin-vehicle-action-button delete"
                            title="Delete vehicle"
                            aria-label={`Delete ${car.name}`}
                            aria-busy={deletingCarId === car.id}
                            disabled={deletingCarId !== null}
                            onClick={() => handleDeleteVehicle(car)}
                          >
                            <Trash2 size={16} />
                            <span>
                              {deletingCarId === car.id
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

export default AdminVehiclesPage;
