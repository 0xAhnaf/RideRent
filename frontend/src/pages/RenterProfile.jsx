import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api";
import "./RenterProfile.css";
import RenterSidebar from "./RenterProfile/RenterSidebar";
import PersonalInformation from "./RenterProfile/PersonalInformation";
import RentalActivity from "./RenterProfile/RentalActivity";

const profileForm = (user) => ({
  name: user?.name || "",
  phone: user?.phone || "",
  address: user?.address || "",
});

export default function RenterProfile() {
  const { user, loading, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [bookingStatistics, setBookingStatistics] = useState(null);
  const [vehicleBookings, setVehicleBookings] = useState([]);
  const [completedVehicleTrips, setCompletedVehicleTrips] = useState([]);
  const [ambulanceBookings, setAmbulanceBookings] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveInProgress = useRef(false);
  const [notice, setNotice] = useState(null);
  const [formData, setFormData] = useState(() => profileForm(user));

  useEffect(() => {
    if (!editing) {
      setFormData(profileForm(user));
    }
  }, [user, editing]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setFormData(profileForm(user));
    setNotice(null);
    setEditing(true);
  };

  const handleCancel = () => {
    setFormData(profileForm(user));
    setEditing(false);
    setNotice(null);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (saveInProgress.current) return;

    saveInProgress.current = true;
    setSaving(true);
    setNotice(null);

    try {
      const response = await apiFetch("/api/profile", {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        const validation =
          data.errors && Object.values(data.errors).flat().join(" ");
        throw new Error(validation || data.message || "Failed to update profile.");
      }

      if (!data.user) {
        throw new Error("Profile response was incomplete. Please reload to check your details.");
      }

      setUser(data.user);
      setEditing(false);
      setNotice({ type: "success", text: "Profile updated successfully." });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      saveInProgress.current = false;
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      setActivityLoading(true);
      setActivityError("");
      const endpoints = [
        "statistics",
        "vehicle-bookings",
        "completed-vehicle-trips",
        "ambulance-bookings",
      ];

      const results = await Promise.allSettled(
        endpoints.map(async (endpoint) => {
          const response = await apiFetch(`/api/renter/profile/${endpoint}`);
          if (!response.ok) throw new Error(endpoint);
          const data = await response.json();
          if (!Array.isArray(data)) throw new Error(endpoint);
          return data;
        })
      );

      if (cancelled) return;

      setBookingStatistics(
        results[0].status === "fulfilled" ? results[0].value[0] || null : null
      );
      setVehicleBookings(
        results[1].status === "fulfilled" ? results[1].value : []
      );
      setCompletedVehicleTrips(
        results[2].status === "fulfilled" ? results[2].value : []
      );
      setAmbulanceBookings(
        results[3].status === "fulfilled" ? results[3].value : []
      );

      if (results.some((result) => result.status === "rejected")) {
        setActivityError(
          "Rental activity could not be loaded completely. Please refresh the page to try again."
        );
      }

      setActivityLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading || !user) {
    return (
      <div className="renter-profile-page">
        <div className="renter-profile-loading" role="status">
          {loading ? "Loading profile..." : "Please login to view your profile."}
        </div>
      </div>
    );
  }

  return (
    <div className="renter-profile-page">
      <div className="renter-profile-container">
        <RenterSidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <main className="renter-content" id="renter-account-content">
          {activeTab === "personal" ? (
            <PersonalInformation
              user={user}
              editing={editing}
              saving={saving}
              formData={formData}
              handleChange={handleChange}
              handleSave={handleSave}
              handleEdit={handleEdit}
              handleCancel={handleCancel}
              notice={notice}
            />
          ) : (
            <RentalActivity
              bookingStatistics={bookingStatistics}
              vehicleBookings={vehicleBookings}
              completedVehicleTrips={completedVehicleTrips}
              ambulanceBookings={ambulanceBookings}
              loading={activityLoading}
              error={activityError}
            />
          )}
        </main>
      </div>
    </div>
  );
}