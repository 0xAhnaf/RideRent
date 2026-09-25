import React from "react";

export default function RenterSidebar({
  activeTab,
  setActiveTab,
}) {
  return (
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
          activeTab === "activity"
            ? "sidebar-item active"
            : "sidebar-item"
        }
        onClick={() => setActiveTab("activity")}
      >
        <span>📊</span>
        Rental Activity
      </button>
    </aside>
  );
}