import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

/*
|--------------------------------------------------------------------------
| AdminRoute
|--------------------------------------------------------------------------
|
| Protects every Admin-only page.
|
| Authentication is checked first.
|
| Then the user's role is checked.
|
*/

function AdminRoute() {
  const {
    user,
    loading,
    isAuthenticated,
  } = useAuth();

  /*
  |--------------------------------------------------------------------------
  | Wait Until Authentication Is Checked
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="auth-loading">
        Checking authentication...
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Not Logged In
  |--------------------------------------------------------------------------
  */

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Logged In But Not Admin
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | Database uses lowercase:
  |
  | "admin"
  |
  | Not:
  |
  | "Admin"
  |
  */

  if (user?.role !== "admin") {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Admin
  |--------------------------------------------------------------------------
  */

  return <Outlet />;
}

export default AdminRoute;