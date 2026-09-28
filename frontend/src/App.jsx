import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import LandingPage from "./pages/LandingPage";
import VehiclesPage from "./pages/VehiclesPage";

import LoginPage from "./pages/AuthPages/LoginPage";
import SignUpPage from "./pages/AuthPages/SignUpPage";
import RagChatWidget from "./components/RagChatWidget";
import AdminDashboard from "./pages/AdminDashboard";
import AdminVehiclesPage from "./pages/AdminVehiclesPage";
import AddVehiclePage from "./pages/AddVehiclePage";
import EditVehiclePage from "./pages/EditVehiclePage";
import AdminDriversPage from "./pages/AdminDriversPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminBookingsPage from "./pages/AdminBookingsPage";
import AdminPaymentsPage from "./pages/AdminPaymentsPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import AdminAmbulancePage from "./pages/AdminAmbulancePage";
import RenterProfile from "./pages/RenterProfile";

import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";

function GuestOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />

        {/* Login and signup: logged-in users return to Landing Page */}
        <Route
          path="/login"
          element={
            <GuestOnlyRoute>
              <LoginPage />
            </GuestOnlyRoute>
          }
        />

        <Route
          path="/signup"
          element={
            <GuestOnlyRoute>
              <SignUpPage />
            </GuestOnlyRoute>
          }
        />

        {/* Renter pages */}
        <Route element={<ProtectedRoute renterOnly />}>
          <Route path="/renter-profile" element={<RenterProfile />} />
        </Route>

        {/* Admin pages */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/admin-vehicle" element={<AdminVehiclesPage />} />
          <Route path="/admin/add-vehicle" element={<AddVehiclePage />} />
          <Route path="/admin/edit-vehicle/:id" element={<EditVehiclePage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/drivers" element={<AdminDriversPage />} />
          <Route path="/admin/bookings" element={<AdminBookingsPage />} />
          <Route path="/admin/payments" element={<AdminPaymentsPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
          <Route path="/admin/ambulance" element={<AdminAmbulancePage />} />
        </Route>

        {/* Old vehicle URL */}
        <Route
          path="/admin-vehicle"
          element={<Navigate to="/admin/admin-vehicle" replace />}
        />

        {/* Unknown URL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <RagChatWidget />
    </BrowserRouter>
  );
}

export default App;
