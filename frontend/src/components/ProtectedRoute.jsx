import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Wait until we know whether Laravel's session is authenticated
  if (loading) {
    return <div>Loading...</div>;
  }

  // User is not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // User is authenticated
  return <Outlet />;
}

export default ProtectedRoute;