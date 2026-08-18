import React, { useState } from "react";
import "../styles/admin-vehicles-page.css";

function AdminVehiclesPage() {
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "Sedan",
    seats: "5",
    quantity: "1",
    price: "",
    image_key: "",
    status: "available",
  });

  // Placeholder mock data to visually demonstrate the layout
  const [cars, setCars] = useState([
    {
      id: 1,
      name: "Toyota Axio",
      brand: "Toyota",
      category: "Sedan",
      seats: 5,
      quantity: 5,
      price: 3000,
      image_key: "Toyota Axio",
      status: "available",
    },
    {
      id: 2,
      name: "BMW X5",
      brand: "BMW",
      category: "Luxury Sedan",
      seats: 5,
      quantity: 1,
      price: 40000,
      image_key: "BMW X5 M",
      status: "available",
    },
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Front-end state addition (Placeholder logic)
    const newCar = {
      ...formData,
      id: Date.now(),
      seats: Number(formData.seats),
      quantity: Number(formData.quantity),
      price: Number(formData.price),
    };
    setCars([newCar, ...cars]);

    // Reset Form
    setFormData({
      name: "",
      brand: "",
      category: "Sedan",
      seats: "5",
      quantity: "1",
      price: "",
      image_key: "",
      status: "available",
    });
  };

  return (
    <div className="admin-vehicles-container">
      <header className="admin-header">
        <h1>Admin Vehicle Management</h1>
      </header>

      <main className="admin-main-content">
        {/* TOP CARD: ADD A CAR FORM */}
        <section className="add-car-card">
          <div className="card-header">
            <h2>Add New Vehicle</h2>
          </div>

          <form onSubmit={handleSubmit} className="add-car-form">
            <div className="form-group">
              <label htmlFor="name">Vehicle Name</label>
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

            <div className="form-group">
              <label htmlFor="brand">Brand</label>
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

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="Sedan">Sedan</option>
                <option value="Hatchback">Hatchback</option>
                <option value="SUV">SUV</option>
                <option value="Premium SUV">Premium SUV</option>
                <option value="MPV">MPV</option>
                <option value="Microbus">Microbus</option>
                <option value="Bus">Bus</option>
                <option value="Luxury Sedan">Luxury Sedan</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="seats">Seats</label>
              <input
                id="seats"
                type="number"
                name="seats"
                min="1"
                value={formData.seats}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity</label>
              <input
                id="quantity"
                type="number"
                name="quantity"
                min="0"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">Price / Day (৳)</label>
              <input
                id="price"
                type="number"
                name="price"
                min="0"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g. 3000"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="image_key">Image Key</label>
              <input
                id="image_key"
                type="text"
                name="image_key"
                value={formData.image_key}
                onChange={handleChange}
                placeholder="e.g. Toyota Axio"
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                Add Vehicle
              </button>
            </div>
          </form>
        </section>

        {/* BOTTOM SECTION: LIST OF CARS */}
        <section className="existing-cars-section">
          <div className="section-title">
            <h2>Vehicles in System ({cars.length})</h2>
          </div>

          <div className="cars-grid">
            {cars.map((car) => (
              <article key={car.id} className="car-card">
                <div className="car-card-header">
                  <h3>{car.name}</h3>
                  <span className={`status-badge ${car.status}`}>
                    {car.status}
                  </span>
                </div>

                <p className="car-brand">{car.brand}</p>

                <div className="car-details">
                  <p>
                    <strong>Category:</strong> {car.category}
                  </p>
                  <p>
                    <strong>Seats:</strong> {car.seats} Seats
                  </p>
                  <p>
                    <strong>Quantity:</strong> {car.quantity} Available
                  </p>
                  <p>
                    <strong>Price:</strong> ৳
                    {Number(car.price).toLocaleString()} / day
                  </p>
                  {car.image_key && (
                    <p>
                      <strong>Image Key:</strong> {car.image_key}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminVehiclesPage;
