import React from "react";

export default function RenterSidebar({ user, activeTab, setActiveTab }) {
  const initials = (user?.name || "Renter").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <aside className="renter-sidebar">
      <div className="renter-sidebar-brand"><span className="renter-eyebrow">YOUR ACCOUNT</span><h2>Renter Profile</h2></div>
      <div className="renter-sidebar-person"><div className="renter-avatar" aria-hidden="true">{initials}</div><strong>{user?.name || "Renter"}</strong><span>{user?.email || ""}</span></div>
      <nav className="renter-navigation" aria-label="Profile sections">
        <button type="button" className={`sidebar-item ${activeTab === "personal" ? "active" : ""}`} aria-current={activeTab === "personal" ? "page" : undefined} aria-controls="renter-account-content" onClick={() => setActiveTab("personal")}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></svg><span>Personal Information</span><span className="renter-nav-arrow" aria-hidden="true">›</span></button>
        <button type="button" className={`sidebar-item ${activeTab === "activity" ? "active" : ""}`} aria-current={activeTab === "activity" ? "page" : undefined} aria-controls="renter-account-content" onClick={() => setActiveTab("activity")}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4m8-4v4M4 11h16m-12 4h3m2 0h3" /></svg><span>Rental Activity</span><span className="renter-nav-arrow" aria-hidden="true">›</span></button>
      </nav>
      <p className="renter-sidebar-note">Your details and rental history, in one place.</p>
    </aside>
  );
}
