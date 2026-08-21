import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import VehiclesPage from "./pages/VehiclesPage";
import LoginPage from "./pages/AuthPages/LoginPage";
import SignUpPage from "./pages/AuthPages/SignUpPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminVehiclesPage from "./pages/AdminVehiclesPage";
import AddVehiclePage from "./pages/AddVehiclePage";
import EditVehiclePage from "./pages/EditVehiclePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/vehicles" element={<VehiclesPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        <Route path="/admin" element={<AdminDashboard />} />
        <Route
          path="/admin/admin-vehicle"
          element={<AdminVehiclesPage />}
        />
        <Route path="/admin/add-vehicle" element={<AddVehiclePage />} />
        <Route
          path="/admin/edit-vehicle/:id"
          element={<EditVehiclePage />}
        />

        {/* Keep the previous vehicle URL working */}
        <Route
          path="/admin-vehicle"
          element={<Navigate to="/admin/admin-vehicle" replace />}
        />

        {/* Invalid URL → Home page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;