import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api";
import "./RenterProfile.css";

import RenterSidebar from "./RenterProfile/RenterSidebar";
import PersonalInformation from "./RenterProfile/PersonalInformation";
import RentalActivity from "./RenterProfile/RentalActivity";

export default function RenterProfile() {
  const { user, loading, setUser } = useAuth();

  const [activeTab, setActiveTab] = useState("personal");

  const [bookingStatistics, setBookingStatistics] = useState(null);
  const [vehicleBookings, setVehicleBookings] = useState([]);
  const [completedVehicleTrips, setCompletedVehicleTrips] =
    useState([]);
  const [ambulanceBookings, setAmbulanceBookings] =
    useState([]);

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
        const [
          statisticsResponse,
          vehiclesResponse,
          completedVehicleTripsResponse,
          ambulancesResponse,
        ] = await Promise.all([
          apiFetch("/api/renter/profile/statistics"),
          apiFetch("/api/renter/profile/vehicle-bookings"),
          apiFetch(
            "/api/renter/profile/completed-vehicle-trips"
          ),
          apiFetch("/api/renter/profile/ambulance-bookings"),
        ]);

        if (statisticsResponse.ok) {
          const statistics =
            await statisticsResponse.json();

          setBookingStatistics(statistics[0] || null);
        }

        if (vehiclesResponse.ok) {
          const vehicles =
            await vehiclesResponse.json();

          setVehicleBookings(vehicles);
        }

        if (completedVehicleTripsResponse.ok) {
          const completedTrips =
            await completedVehicleTripsResponse.json();

          setCompletedVehicleTrips(completedTrips);
        }

        if (ambulancesResponse.ok) {
          const ambulances =
            await ambulancesResponse.json();

          setAmbulanceBookings(ambulances);
        }
      } catch (error) {
        console.error(
          "Failed to load renter data:",
          error
        );
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
        <RenterSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <main className="renter-content">
          {activeTab === "personal" && (
            <PersonalInformation
              user={user}
              editing={editing}
              formData={formData}
              handleChange={handleChange}
              handleSave={handleSave}
              setEditing={setEditing}
            />
          )}

          {activeTab === "activity" && (
            <RentalActivity
              bookingStatistics={bookingStatistics}
              vehicleBookings={vehicleBookings}
              completedVehicleTrips={completedVehicleTrips}
              ambulanceBookings={ambulanceBookings}
            />
          )}
        </main>
      </div>
    </div>
  );
}