function AdminHeader({
  title,
  subtitle,
  showNotifications = false,
}) {
  return (
    <header className="admin-header">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <div className="admin-header-right">
        {showNotifications && (
          <button className="notification-button" aria-label="Notifications">
            ♢<span>3</span>
          </button>
        )}

        <div className="admin-profile">
          <div className="admin-avatar">A</div>

          <div className="admin-profile-info">
            <strong>Admin User</strong>
            <span>System Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
