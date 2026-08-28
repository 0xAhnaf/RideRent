import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/admin-dashboard.css";
import "../styles/add-vehicle-page.css";

const navItems = [
  { label: "Dashboard", icon: "▦", path: "/admin" },
  { label: "Manage Users", icon: "♙" },
  { label: "Vehicles", icon: "▱", path: "/admin-vehicle" },
  { label: "Drivers", icon: "♧", path: "/admin/drivers" },
  { label: "Bookings", icon: "▣", path: "/admin/bookings" },
  { label: "Payments", icon: "৳" },
  { label: "Ambulance / Emergency", icon: "✚", danger: true },
  { label: "Reviews", icon: "☆" },
  { label: "Reports", icon: "▥" },
];

const createInitialFormData = () => ({
  vehicleType: "Car",
  name: "",
  brand: "",
  category: "Sedan",
  seats: "",
  quantity: "",
  price: "",
  status: "available",
});

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

function AddVehiclePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState(createInitialFormData);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageMessage, setImageMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isAmbulance = formData.vehicleType === "Ambulance";
  const showsStandardFields =
    formData.vehicleType === "Car" ||
    formData.vehicleType === "Others";

  useEffect(() => {
    if (!selectedImage) {
      setImagePreviewUrl("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(selectedImage);
    setImagePreviewUrl(previewUrl);

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

    if (name === "vehicleType") {
      setSelectedImage(null);
      setImageMessage("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;

    setSubmitError("");
    setSuccessMessage("");

    if (!file) {
      setSelectedImage(null);
      setImageMessage("");
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
      setImageMessage(
        "Please choose a PNG, JPG, JPEG, or WEBP image.",
      );
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      event.target.value = "";
      setSelectedImage(null);
      setImageMessage(
        "Please choose an image smaller than 2 MB.",
      );
      return;
    }

    setSelectedImage(file);
    setImageMessage(
      "Image is ready. RideRent will create a unique filename automatically.",
    );
  };

  const resetForm = () => {
    setFormData(createInitialFormData());
    setSelectedImage(null);
    setImageMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!showsStandardFields) {
      return;
    }

    setSubmitError("");
    setSuccessMessage("");

    if (!selectedImage) {
      setSubmitError(
        "Please select a vehicle image before submitting.",
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload = new FormData();

      payload.append("name", formData.name.trim());
      payload.append("brand", formData.brand.trim());
      payload.append("category", formData.category.trim());
      payload.append("seats", formData.seats);
      payload.append("quantity", formData.quantity);
      payload.append("price", formData.price);
      payload.append("status", formData.status);
      payload.append("image", selectedImage);

      const response = await fetch(
        "http://127.0.0.1:8000/api/cars",
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
            result.message ||
            "Unable to save the vehicle to the database.",
        );
      }

      setSuccessMessage(
        `${
          result.vehicle?.name || formData.name.trim()
        } was added successfully to the database! Redirecting...`,
      );

      resetForm();

      setTimeout(() => {
        navigate("/admin-vehicle");
      }, 1500);
    } catch (error) {
      console.error("Error adding vehicle:", error);

      setSubmitError(
        error.message || "Unable to add the vehicle.",
      );
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
          <button
            type="button"
            className="admin-nav-item"
          >
            <span className="nav-icon">?</span>
            <span>Support</span>
          </button>

          <button
            type="button"
            className="admin-nav-item"
          >
            <span className="nav-icon">↪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h2>Add Vehicle</h2>
            <p>
              Create a new vehicle record for the RideRent fleet.
            </p>
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
          className="add-vehicle-back-button"
          onClick={() => navigate("/admin-vehicle")}
        >
          <ArrowLeft size={17} />
          Back to Vehicle Management
        </button>

        <section className="dashboard-card add-vehicle-form-card">
          <div className="card-header add-vehicle-card-header">
            <div>
              <span className="add-vehicle-kicker">
                Vehicle Setup
              </span>

              <h3>Add New Vehicle</h3>

              <p>
                Enter the vehicle details below. Required fields
                are marked with an asterisk.
              </p>
            </div>
          </div>

          <form
            className="add-vehicle-form"
            onSubmit={handleSubmit}
          >
            <div className="add-vehicle-field add-vehicle-type-field">
              <label htmlFor="vehicleType">
                Vehicle Type *
              </label>

              <select
                id="vehicleType"
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
              >
                <option value="Car">Car</option>
                <option value="Ambulance">Ambulance</option>
                <option value="Others">Others</option>
              </select>
            </div>

            {isAmbulance && (
              <div className="add-vehicle-ambulance-placeholder">
                <AlertCircle size={22} />

                <div>
                  <strong>
                    Ambulance vehicle fields will be added later.
                  </strong>

                  <p>
                    The ambulance module is not implemented yet,
                    so no ambulance data will be submitted from
                    this page.
                  </p>
                </div>
              </div>
            )}

            {showsStandardFields && (
              <>
                <div className="add-vehicle-fields-grid">
                  <div className="add-vehicle-field">
                    <label htmlFor="name">
                      Vehicle Name *
                    </label>

                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Toyota Axio"
                      required
                    />
                  </div>

                  <div className="add-vehicle-field">
                    <label htmlFor="brand">Brand *</label>

                    <input
                      id="brand"
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="e.g. Toyota"
                      required
                    />
                  </div>

                  <div className="add-vehicle-field">
                    <label htmlFor="category">
                      Category *
                    </label>

                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>
                        Select Category
                      </option>
                      <option value="Sedan">Sedan</option>
                      <option value="Hatchback">
                        Hatchback
                      </option>
                      <option value="SUV">SUV</option>
                      <option value="Premium SUV">
                        Premium SUV
                      </option>
                      <option value="MPV">MPV</option>
                      <option value="Microbus">
                        Microbus
                      </option>
                      <option value="Bus">Bus</option>
                      <option value="Luxury Sedan">
                        Luxury Sedan
                      </option>
                    </select>
                  </div>

                  <div className="add-vehicle-field">
                    <label htmlFor="seats">
                      Number of Seats *
                    </label>

                    <input
                      id="seats"
                      type="number"
                      name="seats"
                      min="1"
                      step="1"
                      value={formData.seats}
                      onChange={handleChange}
                      placeholder="e.g. 5"
                      required
                    />
                  </div>

                  <div className="add-vehicle-field">
                    <label htmlFor="quantity">
                      Quantity Available *
                    </label>

                    <input
                      id="quantity"
                      type="number"
                      name="quantity"
                      min="0"
                      step="1"
                      value={formData.quantity}
                      onChange={handleChange}
                      placeholder="e.g. 5"
                      required
                    />
                  </div>

                  <div className="add-vehicle-field">
                    <label htmlFor="price">
                      Starting Price Per Day *
                    </label>

                    <div className="add-vehicle-price-input">
                      <span>৳</span>

                      <input
                        id="price"
                        type="number"
                        name="price"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="e.g. 3000"
                        required
                      />
                    </div>
                  </div>

                  <div className="add-vehicle-field">
                    <label htmlFor="status">Status *</label>

                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      required
                    >
                      <option value="available">
                        Available
                      </option>
                      <option value="unavailable">
                        Unavailable
                      </option>
                    </select>
                  </div>
                </div>

                <div className="add-vehicle-image-section">
                  <div className="add-vehicle-image-instruction">
                    <div className="add-vehicle-instruction-icon">
                      <ImageIcon size={22} />
                    </div>

                    <div>
                      <strong>
                        Choose a clear vehicle image.
                      </strong>

                      <p>
                        RideRent will create a unique filename and
                        store the image in Laravel public storage.
                      </p>

                      <span>No manual rename is required.</span>
                      <code>PNG, JPG, JPEG or WEBP</code>
                    </div>
                  </div>

                  <div className="add-vehicle-upload-column">
                    <label
                      htmlFor="vehicle-image"
                      className="add-vehicle-upload-box"
                    >
                      {imagePreviewUrl ? (
                        <img
                          src={imagePreviewUrl}
                          alt="Selected vehicle preview"
                        />
                      ) : (
                        <>
                          <Upload size={28} />
                          <strong>Image Upload</strong>
                          <span>
                            PNG, JPG, JPEG or WEBP • Maximum 2 MB
                          </span>
                        </>
                      )}

                      <input
                        ref={fileInputRef}
                        id="vehicle-image"
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        onChange={handleImageChange}
                        required
                      />
                    </label>

                    {selectedImage && (
                      <div className="add-vehicle-selected-file">
                        <span>{selectedImage.name}</span>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            setImageMessage("");

                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {imageMessage && (
                      <div
                        className={`add-vehicle-image-message ${
                          selectedImage
                            ? "success"
                            : "error"
                        }`}
                      >
                        {selectedImage ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <AlertCircle size={16} />
                        )}

                        <span>{imageMessage}</span>
                      </div>
                    )}

                    <p className="add-vehicle-runtime-note">
                      The image file is stored in Laravel public
                      storage. Only its relative path is saved in
                      the database.
                    </p>
                  </div>
                </div>

                {submitError && (
                  <div className="add-vehicle-form-message error">
                    <AlertCircle size={18} />
                    <span>{submitError}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="add-vehicle-form-message success">
                    <CheckCircle2 size={18} />
                    <span>{successMessage}</span>
                  </div>
                )}

                <div className="add-vehicle-form-actions">
                  <button
                    type="button"
                    className="add-vehicle-secondary-button"
                    onClick={() =>
                      navigate("/admin-vehicle")
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="add-vehicle-submit-button"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Adding Vehicle..."
                      : "Add Vehicle"}
                  </button>
                </div>
              </>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}

export default AddVehiclePage;
