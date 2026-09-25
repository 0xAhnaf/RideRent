import React from "react";

export default function PersonalInformation({
  user,
  editing,
  formData,
  handleChange,
  handleSave,
  setEditing,
}) {
  return (
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
  );
}