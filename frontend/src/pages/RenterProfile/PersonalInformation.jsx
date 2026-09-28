import React from "react";

export default function PersonalInformation({ user, editing, saving, formData, handleChange, handleSave, handleEdit, handleCancel, notice }) {
  return (
    <>
      <header className="renter-page-heading"><span className="renter-eyebrow">ACCOUNT SETTINGS</span><h1>Personal Information</h1><p>Manage the contact details associated with your account.</p></header>
      <section className="profile-card" aria-labelledby="profile-details-title">
        <div className="renter-card-heading"><div><h2 id="profile-details-title">Profile details</h2><p>Keep your information up to date for your next trip.</p></div><span className="renter-section-label">{editing ? "EDITING PROFILE" : "PERSONAL DETAILS"}</span></div>
        <form onSubmit={handleSave}>
          <div className="renter-info-grid">
            <div className="profile-field"><label htmlFor={editing ? "renter-name" : undefined}>Full name</label>{editing ? <input id="renter-name" name="name" autoComplete="name" value={formData.name} onChange={handleChange} disabled={saving} required /> : <p>{user.name || "Not provided"}</p>}</div>
            <div className="profile-field"><span className="renter-field-label">Email address</span><p>{user.email || "Not provided"}</p>{editing && <small>Email cannot be edited here.</small>}</div>
            <div className="profile-field"><label htmlFor={editing ? "renter-phone" : undefined}>Phone number</label>{editing ? <input id="renter-phone" type="tel" name="phone" autoComplete="tel" value={formData.phone} onChange={handleChange} disabled={saving} /> : <p>{user.phone || "Not provided"}</p>}</div>
            <div className="profile-field"><label htmlFor={editing ? "renter-address" : undefined}>Address</label>{editing ? <input id="renter-address" name="address" autoComplete="street-address" value={formData.address} onChange={handleChange} disabled={saving} /> : <p>{user.address || "Not provided"}</p>}</div>
          </div>
          {notice && <div className={`renter-notice ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>{notice.text}</div>}
          <div className="profile-buttons"><span className="renter-form-hint">{editing ? "Review your details before saving." : "You can update your name, phone and address."}</span>{editing ? <><button type="button" className="cancel-profile-btn" onClick={handleCancel} disabled={saving}>Cancel</button><button type="submit" className="save-profile-btn" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button></> : <button type="button" className="edit-profile-btn" onClick={handleEdit}>Edit profile <span aria-hidden="true">↗</span></button>}</div>
        </form>
      </section>
    </>
  );
}
