import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import VehiclesPage from "./pages/VehiclesPage";
import LoginPage from "./pages/AuthPages/LoginPage";
import SignUpPage from "./pages/AuthPages/SignUpPage";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/vehicles" element={<VehiclesPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        <Route path="/admin" element={<AdminDashboard />} />

        {/* Invalid URL → Home page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;