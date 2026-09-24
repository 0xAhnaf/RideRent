import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api";
import "./RenterProfile.css";

export default function RenterProfile() {
  const { user, loading, setUser } = useAuth();

  const [activeTab, setActiveTab] = useState("personal");

  const [bookingStatistics, setBookingStatistics] = useState(null);
  const [vehicleBookings, setVehicleBookings] = useState([]);
  const [ambulanceBookings, setAmbulanceBookings] = useState([]);

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      const response = await apiFetch("/api/profile", {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to update profile.");
        return;
      }

      setUser(data.user);
      setEditing(false);

      alert("Profile updated successfully.");
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }
  };

  useEffect(() => {
    const loadRenterData = async () => {
      try {
        const [statisticsResponse, vehiclesResponse, ambulancesResponse] =
          await Promise.all([
            apiFetch("/api/renter/profile/statistics"),
            apiFetch("/api/renter/profile/vehicle-bookings"),
            apiFetch("/api/renter/profile/ambulance-bookings"),
          ]);

        if (statisticsResponse.ok) {
          const statistics = await statisticsResponse.json();
          setBookingStatistics(statistics[0] || null);
        }

        if (vehiclesResponse.ok) {
          const vehicles = await vehiclesResponse.json();
          setVehicleBookings(vehicles);
        }

        if (ambulancesResponse.ok) {
          const ambulances = await ambulancesResponse.json();
          setAmbulanceBookings(ambulances);
        }
      } catch (error) {
        console.error("Failed to load renter data:", error);
      }
    };

    if (user) {
      loadRenterData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="renter-profile-page">
        <div className="renter-profile-loading">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="renter-profile-page">
        <div className="renter-profile-loading">
          Please login to view your profile.
        </div>
      </div>
    );
  }

  return (
    <div className="renter-profile-page">
      <div className="renter-profile-container">

        <aside className="renter-sidebar">
          <h2>Renter Profile</h2>

          <button
            className={
              activeTab === "personal"
                ? "sidebar-item active"
                : "sidebar-item"
            }
            onClick={() => setActiveTab("personal")}
          >
            <span>👤</span>
            Personal Information
          </button>

          <button
            className={
              activeTab === "statistics"
                ? "sidebar-item active"
                : "sidebar-item"
            }
            onClick={() => setActiveTab("statistics")}
          >
            <span>📊</span>
            Statistics
          </button>

          <button
            className={
              activeTab === "history"
                ? "sidebar-item active"
                : "sidebar-item"
            }
            onClick={() => setActiveTab("history")}
          >
            <span>📋</span>
            History
          </button>
        </aside>

        <main className="renter-content">

          {activeTab === "personal" && (
            <>
              <h1>Personal Information</h1>

              <div className="profile-card">

                <div className="profile-field">
                  <label>Name</label>

                  {editing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  ) : (
                    <p>{user.name || "Not provided"}</p>
                  )}
                </div>

                <div className="profile-field">
                  <label>Email</label>
                  <p>{user.email || "Not provided"}</p>
                </div>

                <div className="profile-field">
                  <label>Phone</label>

                  {editing ? (
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  ) : (
                    <p>{user.phone || "Not provided"}</p>
                  )}
                </div>

                <div className="profile-field">
                  <label>Address</label>

                  {editing ? (
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  ) : (
                    <p>{user.address || "Not provided"}</p>
                  )}
                </div>

                {editing ? (
                  <div className="profile-buttons">

                    <button
                      className="save-profile-btn"
                      onClick={handleSave}
                    >
                      Save
                    </button>

                    <button
                      className="cancel-profile-btn"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </button>

                  </div>
                ) : (
                  <button
                    className="edit-profile-btn"
                    onClick={() => setEditing(true)}
                  >
                    Edit Profile
                  </button>
                )}

              </div>
            </>
          )}

          {activeTab === "statistics" && (
            <>
              <h1>Statistics</h1>

              <div className="statistics-grid">

                <div className="stat-card">
                  <h3>Total Bookings</h3>
                  <p>{bookingStatistics?.total_bookings ?? 0}</p>
                </div>

                <div className="stat-card">
                  <h3>Completed Rentals</h3>
                  <p>{bookingStatistics?.completed_bookings ?? 0}</p>
                </div>

                <div className="stat-card">
                  <h3>Cancelled Rentals</h3>
                  <p>{bookingStatistics?.cancelled_bookings ?? 0}</p>
                </div>

                <div className="stat-card">
                  <h3>Total Spent</h3>
                  <p>৳{bookingStatistics?.total_spent ?? 0}</p>
                </div>

              </div>
            </>
          )}

          {activeTab === "history" && (
            <>
              <h1>Rental History</h1>

              <div className="history-card">
                <h2>Vehicle Bookings</h2>

                {vehicleBookings.length === 0 ? (
                  <p>No vehicle booking history yet.</p>
                ) : (
                  <div className="booking-list">
                    {vehicleBookings.map((booking) => (
                      <div className="booking-item" key={booking.booking_id}>

                        <div>
                          <strong>
                            {booking.vehicle_brand} {booking.vehicle_name}
                          </strong>

                          <p>
                            Booking ID: {booking.booking_id}
                          </p>

                          <p>
                            Category: {booking.vehicle_category}
                          </p>

                          <p>
                            Pickup: {booking.pickup}
                          </p>

                          <p>
                            Destination: {booking.destination}
                          </p>

                          <p>
                            Date: {booking.trip_datetime}
                          </p>

                          <p>
                            Duration: {booking.trip_duration}
                          </p>
                        </div>

                        <div>
                          <p>
                            Status: {booking.booking_status}
                          </p>

                          <p>
                            Total: ৳{booking.total_amount}
                          </p>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="history-card">
                <h2>Ambulance Bookings</h2>

                {ambulanceBookings.length === 0 ? (
                  <p>No ambulance booking history yet.</p>
                ) : (
                  <div className="booking-list">
                    {ambulanceBookings.map((booking) => (
                      <div className="booking-item" key={booking.booking_id}>

                        <div>
                          <strong>
                            Ambulance Booking #{booking.booking_id}
                          </strong>

                          <p>
                            Pickup District: {booking.pickup_district}
                          </p>

                          <p>
                            Pickup Thana: {booking.pickup_thana}
                          </p>

                          <p>
                            Pickup Address: {booking.pickup_address}
                          </p>

                          <p>
                            Destination District: {booking.destination_district}
                          </p>

                          <p>
                            Destination Thana: {booking.destination_thana}
                          </p>

                          <p>
                            Destination Address: {booking.destination_address}
                          </p>

                          <p>
                            Emergency Contact: {booking.emergency_contact}
                          </p>
                        </div>

                        <div>
                          <p>
                            Status: {booking.status}
                          </p>

                          <p>
                            Created: {booking.created_at}
                          </p>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

        </main>

      </div>
    </div>
  );
}