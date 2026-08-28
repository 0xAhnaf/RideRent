import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "../styles/admin-dashboard.css";
import "../styles/edit-vehicle-page.css";

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

const vehicleCategories = [
  "Sedan",
  "Hatchback",
  "SUV",
  "Premium SUV",
  "MPV",
  "Microbus",
  "Bus",
  "Luxury Sedan",
];

const createInitialFormData = () => ({
  name: "",
  brand: "",
  category: "",
  seats: "",
  quantity: "",
  price: "",
  status: "available",
});

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

function VehicleImagePreview({ source, name }) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [source]);

  if (!source || imageError) {
    return (
      <div className="edit-vehicle-image-fallback">
        <ImageIcon size={30} />
        <span>Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={source}
      alt={name || "RideRent vehicle"}
      onError={() => setImageError(true)}
    />
  );
}

function EditVehiclePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef(null);

  const [vehicle, setVehicle] = useState(null);
  const [formData, setFormData] = useState(createInitialFormData);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const existingImageSource = vehicle?.image_url || null;

  useEffect(() => {
    const controller = new AbortController();

    const fetchVehicle = async () => {
      try {
        setLoadingVehicle(true);
        setLoadError("");

        const response = await fetch(
          `http://127.0.0.1:8000/api/cars/${id}`,
          { signal: controller.signal },
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.message || "Unable to load the vehicle.");
        }

        setVehicle(result);
        setFormData({
          name: result.name || "",
          brand: result.brand || "",
          category: result.category || "",
          seats: result.seats ?? "",
          quantity: result.quantity ?? "",
          price: result.price ?? "",
          status: result.status || "available",
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error loading vehicle:", error);
          setLoadError(error.message || "Unable to load the vehicle.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingVehicle(false);
        }
      }
    };

    fetchVehicle();

    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!selectedImage) {
      setSelectedImagePreview("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(selectedImage);
    setSelectedImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedImage]);

  const handleNavigation = (item) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSubmitError("");
    setSuccessMessage("");
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;

    setSubmitError("");
    setSuccessMessage("");

    if (!file) {
      setSelectedImage(null);
      return;
    }

    const allowedMimeTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      event.target.value = "";
      setSelectedImage(null);
      setSubmitError("Please choose a PNG, JPG, JPEG, or WEBP image.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      event.target.value = "";
      setSelectedImage(null);
      setSubmitError("Please choose an image smaller than 2 MB.");
      return;
    }

    setSelectedImage(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitError("");
    setSuccessMessage("");

    try {
      setSubmitting(true);

      const payload = new FormData();

      payload.append("_method", "PUT");
      payload.append("name", formData.name.trim());
      payload.append("brand", formData.brand.trim());
      payload.append("category", formData.category);
      payload.append("seats", formData.seats);
      payload.append("quantity", formData.quantity);
      payload.append("price", formData.price);
      payload.append("status", formData.status);

      if (selectedImage) {
        payload.append("image", selectedImage);
      }

      const response = await fetch(
        `http://127.0.0.1:8000/api/cars/${id}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: payload,
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const validationErrors = result.errors
          ? Object.values(result.errors).flat().join(" ")
          : "";

        throw new Error(
          validationErrors ||
            result.error ||
            result.message ||
            "Unable to update the vehicle.",
        );
      }

      setVehicle(result.vehicle || vehicle);
      clearSelectedImage();
      setSuccessMessage(
        `${result.vehicle?.name || formData.name.trim()} was updated successfully. Redirecting...`,
      );

      setTimeout(() => {
        navigate("/admin/admin-vehicle");
      }, 1400);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      setSubmitError(error.message || "Unable to update the vehicle.");
    } finally {
      setSubmitting(false);
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
            <h2>Edit Vehicle</h2>
            <p>Update an existing vehicle in the RideRent fleet.</p>
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

        <button
          type="button"
          className="edit-vehicle-back-button"
          onClick={() => navigate("/admin/admin-vehicle")}
        >
          <ArrowLeft size={17} />
          Back to Vehicle Management
        </button>

        {loadingVehicle && (
          <section className="dashboard-card edit-vehicle-state-card">
            <div className="edit-vehicle-loader" />
            <p>Loading vehicle information...</p>
          </section>
        )}

        {!loadingVehicle && loadError && (
          <section className="dashboard-card edit-vehicle-state-card error">
            <AlertCircle size={25} />
            <h3>Unable to open this vehicle</h3>
            <p>{loadError}</p>
            <button
              type="button"
              onClick={() => navigate("/admin/admin-vehicle")}
            >
              Return to Vehicles
            </button>
          </section>
        )}

        {!loadingVehicle && !loadError && vehicle && (
          <section className="dashboard-card edit-vehicle-form-card">
            <div className="card-header edit-vehicle-card-header">
              <div>
                <span className="edit-vehicle-kicker">Vehicle Update</span>
                <h3>{vehicle.name}</h3>
                <p>
                  Update the fields below. A new image is optional and the
                  current image will remain when no replacement is selected.
                </p>
              </div>

              <span className="edit-vehicle-record-id">ID #{vehicle.id}</span>
            </div>

            <form className="edit-vehicle-form" onSubmit={handleSubmit}>
              <div className="edit-vehicle-fields-grid">
                <div className="edit-vehicle-field">
                  <label htmlFor="name">Vehicle Name *</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="edit-vehicle-field">
                  <label htmlFor="brand">Brand *</label>
                  <input
                    id="brand"
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="edit-vehicle-field">
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    {!vehicleCategories.includes(formData.category) &&
                      formData.category && (
                        <option value={formData.category}>
                          {formData.category}
                        </option>
                      )}

                    {vehicleCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="edit-vehicle-field">
                  <label htmlFor="seats">Number of Seats *</label>
                  <input
                    id="seats"
                    type="number"
                    name="seats"
                    min="1"
                    step="1"
                    value={formData.seats}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="edit-vehicle-field">
                  <label htmlFor="quantity">Quantity Available *</label>
                  <input
                    id="quantity"
                    type="number"
                    name="quantity"
                    min="0"
                    step="1"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="edit-vehicle-field">
                  <label htmlFor="price">Starting Price Per Day *</label>
                  <div className="edit-vehicle-price-input">
                    <span>৳</span>
                    <input
                      id="price"
                      type="number"
                      name="price"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="edit-vehicle-field">
                  <label htmlFor="status">Status *</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>

              <div className="edit-vehicle-image-grid">
                <div className="edit-vehicle-image-panel">
                  <div className="edit-vehicle-image-panel-heading">
                    <ImageIcon size={18} />
                    <div>
                      <strong>Current Image</strong>
                      <span>This image remains unless you replace it.</span>
                    </div>
                  </div>

                  <div className="edit-vehicle-image-preview">
                    <VehicleImagePreview
                      source={existingImageSource}
                      name={vehicle.name}
                    />
                  </div>
                </div>

                <div className="edit-vehicle-image-panel">
                  <div className="edit-vehicle-image-panel-heading">
                    <Upload size={18} />
                    <div>
                      <strong>Replace Image</strong>
                      <span>Optional • Maximum 2 MB</span>
                    </div>
                  </div>

                  <label
                    htmlFor="edit-vehicle-image"
                    className="edit-vehicle-upload-box"
                  >
                    {selectedImagePreview ? (
                      <img
                        src={selectedImagePreview}
                        alt="New vehicle preview"
                      />
                    ) : (
                      <>
                        <Upload size={27} />
                        <strong>Choose New Image</strong>
                        <span>PNG, JPG, JPEG or WEBP</span>
                      </>
                    )}

                    <input
                      ref={fileInputRef}
                      id="edit-vehicle-image"
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      onChange={handleImageChange}
                    />
                  </label>

                  {selectedImage && (
                    <div className="edit-vehicle-selected-file">
                      <span>{selectedImage.name}</span>
                      <button type="button" onClick={clearSelectedImage}>
                        Remove
                      </button>
                    </div>
                  )}

                  {selectedImage && (
                    <div className="edit-vehicle-image-message success">
                      <CheckCircle2 size={16} />
                      <span>
                        New image is ready. RideRent will store it with a
                        unique filename.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {submitError && (
                <div className="edit-vehicle-form-message error">
                  <AlertCircle size={18} />
                  <span>{submitError}</span>
                </div>
              )}

              {successMessage && (
                <div className="edit-vehicle-form-message success">
                  <CheckCircle2 size={18} />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="edit-vehicle-form-actions">
                <button
                  type="button"
                  className="edit-vehicle-secondary-button"
                  onClick={() => navigate("/admin/admin-vehicle")}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="edit-vehicle-submit-button"
                  disabled={submitting}
                >
                  {submitting ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

export default EditVehiclePage;
