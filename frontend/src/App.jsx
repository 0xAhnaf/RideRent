import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import VehiclesPage from "./pages/VehiclesPage";

import LoginPage from "./pages/AuthPages/LoginPage";
import SignUpPage from "./pages/AuthPages/SignUpPage";

import AdminDashboard from "./pages/AdminDashboard";
import AdminVehiclesPage from "./pages/AdminVehiclesPage";
import AddVehiclePage from "./pages/AddVehiclePage";
import EditVehiclePage from "./pages/EditVehiclePage";
import AdminDriversPage from "./pages/AdminDriversPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminBookingsPage from "./pages/AdminBookingsPage";
import AdminPaymentsPage from "./pages/AdminPaymentsPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import RenterProfile from "./pages/RenterProfile";

import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================================================================
            PUBLIC PAGES
            ================================================================= */}

        <Route path="/" element={<LandingPage />} />

        <Route path="/vehicles" element={<VehiclesPage />} />

        {/* ================================================================
            AUTHENTICATION PAGES
            ================================================================= */}

        <Route path="/login" element={<LoginPage />} />

        <Route path="/signup" element={<SignUpPage />} />

        {/* ================================================================
            AUTHENTICATED USER-ONLY PAGES
            =================================================================
            
            Every route inside this group requires:
            1. User must be logged in.

            Future user-only pages (e.g. My Bookings, Settings) 
            should be added inside this group.
            ================================================================= */}

        <Route element={<ProtectedRoute />}>
          <Route path="/renter-profile" element={<RenterProfile />} />
        </Route>

        {/* ================================================================
            ADMIN-ONLY PAGES
            =================================================================
            
            Every route inside this group requires:
            1. User must be logged in.
            2. User role must be "admin".

            Future Admin pages should be added inside this group.
            ================================================================= */}

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
        </Route>

        {/* ================================================================
            OLD VEHICLE URL
            ================================================================= */}

        <Route
          path="/admin-vehicle"
          element={<Navigate to="/admin/admin-vehicle" replace />}
        />

        {/* ================================================================
            INVALID URL
            ================================================================= */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
