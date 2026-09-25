import {
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiFetch, getCsrfCookie } from "../api";
import { useAuth } from "../context/AuthContext";
import AdminHeader from "../components/admin/AdminHeader";
import AdminSidebar from "../components/admin/AdminSidebar";
import "../styles/admin-dashboard.css";
import "../styles/admin-users-page.css";

const API_URL = "/api/users";

const createInitialFormData = () => ({
  name: "",
  email: "",
  phone: "",
  address: "",
  role: "renter",
  password: "",
});

const sortUsers = (users) =>
  [...users].sort((firstUser, secondUser) =>
    firstUser.name.localeCompare(secondUser.name),
  );

const getApiErrorMessage = (result, fallbackMessage) => {
  const validationMessage = result?.errors
    ? Object.values(result.errors).flat()[0]
    : null;

  return validationMessage || result?.message || fallbackMessage;
};

function AdminUsersPage() {
  const navigate = useNavigate();
  const formSectionRef = useRef(null);
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState(createInitialFormData);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        setLoadError("");

        const response = await apiFetch(API_URL, {
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(getApiErrorMessage(result, "Unable to load users."));
        }

        const userRecords = Array.isArray(result) ? result : result.users;

        setUsers(sortUsers(Array.isArray(userRecords) ? userRecords : []));
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error loading users:", error);
          setLoadError(error.message || "Unable to load users.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingUsers(false);
        }
      }
    };

    fetchUsers();

    return () => controller.abort();
  }, []);

  const userStats = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((user) => user.role === "admin").length,
      renters: users.filter((user) => user.role === "renter").length,
    }),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesSearch =
        !normalizedSearch ||
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        (user.phone || "").toLowerCase().includes(normalizedSearch);

      return matchesRole && matchesSearch;
    });
  }, [users, searchTerm, roleFilter]);

  const handleNavigation = (item) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  const focusForm = () => {
    window.requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const openAddForm = () => {
    setEditingUserId(null);
    setFormData(createInitialFormData());
    setFormError("");
    setActionMessage(null);
    setShowForm(true);
    focusForm();
  };

  const openEditForm = (user) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      address: user.address || "",
      role: user.role,
      password: "",
    });
    setFormError("");
    setActionMessage(null);
    setShowForm(true);
    focusForm();
  };

  const closeForm = () => {
    if (isSaving) {
      return;
    }

    setShowForm(false);
    setEditingUserId(null);
    setFormData(createInitialFormData());
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
    setFormError("");
    setActionMessage(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setActionMessage(null);

    const isEditing = editingUserId !== null;
    const requestUrl = isEditing ? `${API_URL}/${editingUserId}` : API_URL;

    if (!isEditing && formData.password.trim().length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      role: formData.role,
    };

    if (formData.password.trim() !== "") {
      payload.password = formData.password;
    }

    try {
      setIsSaving(true);

      await getCsrfCookie();

      const response = await apiFetch(requestUrl, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(getApiErrorMessage(result, "Unable to save the user."));
      }

      if (isEditing) {
        setUsers((currentUsers) =>
          sortUsers(
            currentUsers.map((user) =>
              user.id === editingUserId ? result.user : user,
            ),
          ),
        );
      } else {
        setUsers((currentUsers) => sortUsers([...currentUsers, result.user]));
      }

      setActionMessage({
        type: "success",
        text:
          result.message ||
          `User ${isEditing ? "updated" : "added"} successfully.`,
      });
      setShowForm(false);
      setEditingUserId(null);
      setFormData(createInitialFormData());
    } catch (error) {
      console.error("Error saving user:", error);
      setFormError(error.message || "Unable to save the user.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (user) => {
    const confirmed = window.confirm(
      `Delete ${user.name}? This will permanently remove the user account.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingUserId(user.id);
      setActionMessage(null);

      await getCsrfCookie();

      const response = await apiFetch(`${API_URL}/${user.id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(result, "Unable to delete the user."),
        );
      }

      setUsers((currentUsers) =>
        currentUsers.filter((currentUser) => currentUser.id !== user.id),
      );

      if (editingUserId === user.id) {
        closeForm();
      }

      setActionMessage({
        type: "success",
        text: result.message || "User deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      setActionMessage({
        type: "error",
        text: error.message || "Unable to delete the user.",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar activeItem="Manage Users" />

      <main className="admin-main">
        <AdminHeader
          title="User Management"
          subtitle="Manage RideRent customer and admin accounts."
        />

        <section className="admin-user-add-section">
          <div className="admin-user-add-copy">
            <span className="admin-user-section-kicker">User Setup</span>
            <h3>Add New User</h3>
            <p>Create and maintain verified accounts for renters and admins.</p>
          </div>

          <button
            type="button"
            className="admin-user-primary-button"
            onClick={openAddForm}
          >
            <Plus size={18} />
            Add New User
          </button>
        </section>

        <section className="admin-user-stats-grid" aria-label="User summary">
          <article className="admin-user-stat-card">
            <span>Total Users</span>
            <strong>{userStats.total}</strong>
          </article>
          <article className="admin-user-stat-card admin">
            <span>Admins</span>
            <strong>{userStats.admins}</strong>
          </article>
          <article className="admin-user-stat-card renter">
            <span>Renters</span>
            <strong>{userStats.renters}</strong>
          </article>
        </section>

        {showForm && (
          <section
            ref={formSectionRef}
            className="dashboard-card admin-user-form-card"
          >
            <div className="admin-user-form-header">
              <div>
                <span className="admin-user-section-kicker">
                  {editingUserId ? "Update Record" : "New Record"}
                </span>
                <h3>{editingUserId ? "Edit User" : "User Information"}</h3>
              </div>

              <button
                type="button"
                className="admin-user-close-button"
                aria-label="Close user form"
                disabled={isSaving}
                onClick={closeForm}
              >
                <X size={19} />
              </button>
            </div>

            <form className="admin-user-form" onSubmit={handleSubmit}>
              <div className="admin-user-field">
                <label htmlFor="user-name">Full Name *</label>
                <input
                  id="user-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  maxLength="255"
                  placeholder="e.g. Rahim Ahmed"
                  required
                  onChange={handleFormChange}
                />
              </div>

              <div className="admin-user-field">
                <label htmlFor="user-email">Email Address *</label>
                <input
                  id="user-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  maxLength="255"
                  placeholder="e.g. rahim@example.com"
                  required
                  onChange={handleFormChange}
                />
              </div>

              <div className="admin-user-field">
                <label htmlFor="user-phone">Phone Number *</label>
                <input
                  id="user-phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  maxLength="20"
                  placeholder="e.g. 01712345678"
                  required
                  onChange={handleFormChange}
                />
              </div>

              <div className="admin-user-field admin-user-role-field">
                <label htmlFor="user-role">Role *</label>
                <select
                  id="user-role"
                  name="role"
                  value={formData.role}
                  required
                  onChange={handleFormChange}
                >
                  <option value="renter">Renter</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="admin-user-field admin-user-address-field">
                <label htmlFor="user-address">Address</label>
                <input
                  id="user-address"
                  name="address"
                  type="text"
                  value={formData.address}
                  maxLength="1000"
                  placeholder="e.g. House 12, Road 5, Dhanmondi, Dhaka"
                  onChange={handleFormChange}
                />
              </div>

              <div className="admin-user-field admin-user-password-field">
                <label htmlFor="user-password">
                  {editingUserId ? "New Password (optional)" : "Password *"}
                </label>
                <input
                  id="user-password"
                  name="password"
                  type="password"
                  value={formData.password}
                  minLength="8"
                  placeholder={
                    editingUserId
                      ? "Leave blank to keep current password"
                      : "At least 8 characters"
                  }
                  required={!editingUserId}
                  onChange={handleFormChange}
                />
              </div>

              {formError && (
                <div className="admin-user-form-error" role="alert">
                  {formError}
                </div>
              )}

              <div className="admin-user-form-actions">
                <button
                  type="button"
                  className="admin-user-secondary-button"
                  disabled={isSaving}
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-user-primary-button"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : editingUserId
                      ? "Update User"
                      : "Save User"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="dashboard-card admin-user-list-card">
          <div className="admin-user-list-header">
            <div>
              <span className="admin-user-section-kicker">User Records</span>
              <h3>Existing Users</h3>
              <p>
                {loadingUsers
                  ? "Loading user records..."
                  : `${users.length} user${users.length === 1 ? "" : "s"} in the system`}
              </p>
            </div>

            <div className="admin-user-filters">
              <label className="admin-user-search">
                <Search size={16} aria-hidden="true" />
                <span className="admin-user-visually-hidden">Search users</span>
                <input
                  type="search"
                  value={searchTerm}
                  placeholder="Search users..."
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>

              <label>
                <span className="admin-user-visually-hidden">
                  Filter by role
                </span>
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                >
                  <option value="all">All roles</option>
                  <option value="admin">Admin</option>
                  <option value="renter">Renter</option>
                </select>
              </label>
            </div>
          </div>

          {actionMessage && (
            <div
              className={`admin-user-action-message ${actionMessage.type}`}
              role={actionMessage.type === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              {actionMessage.text}
            </div>
          )}

          <div className="admin-user-table-wrapper">
            <table className="admin-user-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Role</th>
                  <th className="admin-user-actions-heading">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loadingUsers && (
                  <tr className="admin-user-state-row">
                    <td colSpan="6" className="admin-user-state-cell">
                      Loading users...
                    </td>
                  </tr>
                )}

                {!loadingUsers && loadError && (
                  <tr className="admin-user-state-row">
                    <td
                      colSpan="6"
                      className="admin-user-state-cell admin-user-error-cell"
                    >
                      {loadError}
                    </td>
                  </tr>
                )}

                {!loadingUsers && !loadError && filteredUsers.length === 0 && (
                  <tr className="admin-user-state-row">
                    <td colSpan="6" className="admin-user-state-cell">
                      {users.length === 0
                        ? "No users have been added yet."
                        : "No users match the current search and filter."}
                    </td>
                  </tr>
                )}

                {!loadingUsers &&
                  !loadError &&
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td data-label="User" className="admin-user-main-cell">
                        <div className="admin-user-name-cell">
                          <span className="admin-user-avatar">
                            <UserRound size={19} />
                          </span>
                          <span>
                            <strong>{user.name}</strong>
                            <small>ID #{user.id}</small>
                          </span>
                        </div>
                      </td>
                      <td data-label="Email">
                        <span className="admin-user-contact-line">
                          <Mail size={13} aria-hidden="true" />
                          {user.email}
                        </span>
                      </td>
                      <td data-label="Phone">
                        <span className="admin-user-contact-line">
                          <Phone size={13} aria-hidden="true" />
                          {user.phone || "—"}
                        </span>
                      </td>
                      <td data-label="Address">
                        <span className="admin-user-contact-line admin-user-address-line">
                          <MapPin size={13} aria-hidden="true" />
                          {user.address || "—"}
                        </span>
                      </td>
                      <td data-label="Role">
                        <span className={`admin-user-role ${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td
                        data-label="Actions"
                        className="admin-user-actions-cell"
                      >
                        <div className="admin-user-row-actions">
                          <button
                            type="button"
                            className="admin-user-action-button edit"
                            aria-label={`Edit ${user.name}`}
                            onClick={() => openEditForm(user)}
                          >
                            <Pencil size={15} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            className="admin-user-action-button delete"
                            aria-label={`Delete ${user.name}`}
                            aria-busy={deletingUserId === user.id}
                            disabled={
                              deletingUserId !== null ||
                              isSaving ||
                              currentUser?.id === user.id
                            }
                            onClick={() => handleDelete(user)}
                          >
                            <Trash2 size={15} />
                            <span>
                              {deletingUserId === user.id
                                ? "Deleting..."
                                : "Delete"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminUsersPage;
