import { useNavigate } from "react-router-dom";

const navItems = [
  { label: "Dashboard", icon: "▦", path: "/admin" },
  { label: "Manage Users", icon: "♙", path: "/admin/users" },
  { label: "Vehicles", icon: "▱", path: "/admin/admin-vehicle" },
  { label: "Drivers", icon: "♧", path: "/admin/drivers" },
  { label: "Bookings", icon: "▣", path: "/admin/bookings" },
  { label: "Payments", icon: "৳", path: "/admin/payments" },
  { label: "Ambulance / Emergency", icon: "✚", danger: true },
  { label: "Reviews", icon: "☆" },
  { label: "Reports", icon: "▥", path: "/admin/reports" },
];

function AdminSidebar({ activeItem, dashboardIcon = "▦" }) {
  const navigate = useNavigate();

  const handleNavigation = (item) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  const items = navItems.map((item) =>
    item.label === "Dashboard" ? { ...item, icon: dashboardIcon } : item,
  );

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <img
          src="/src/assets/logo_nobg.png"
          alt="RideRent logo"
          className="admin-logo"
        />

        <div>
          <h1>RideRent</h1>
          <p>Admin Portal</p>
        </div>
      </div>

      <nav className="admin-nav">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`admin-nav-item ${
              item.label === activeItem ? "active" : ""
            } ${item.danger ? "danger-item" : ""}`}
            onClick={() => handleNavigation(item)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <button type="button" className="admin-nav-item">
          <span className="nav-icon">?</span>
          <span>Support</span>
        </button>

        <button type="button" className="admin-nav-item">
          <span className="nav-icon">↪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
