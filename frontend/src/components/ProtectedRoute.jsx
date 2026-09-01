import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

/*
|--------------------------------------------------------------------------
| ProtectedRoute
|--------------------------------------------------------------------------
|
| Used for pages that require authentication.
|
| Example:
|
| <Route element={<ProtectedRoute />}>
|     ...
| </Route>
|
*/

function ProtectedRoute() {
  const {
    isAuthenticated,
    loading,
  } = useAuth();

  const location = useLocation();

  /*
  |--------------------------------------------------------------------------
  | Wait For Authentication Check
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
  |
  | Send the user to login.
  |
  | `state.from` remembers where they wanted to go.
  |
  */

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Authenticated
  |--------------------------------------------------------------------------
  */

  return <Outlet />;
}

export default ProtectedRoute;