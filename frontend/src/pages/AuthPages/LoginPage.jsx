// src/pages/AuthPages/LoginPage.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthLayout from "./components/AuthLayout";
import AuthCard from "./components/AuthCard";
import AuthInput from "./components/AuthInput";
import PasswordInput from "./components/PasswordInput";
import SubmitButton from "./components/SubmitButton";
import SocialLogin from "./components/SocialLogin";
import AuthFooter from "./components/AuthFooter";

function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      console.log("Login response:", data);

      if (!response.ok) {
  setError(data.message || "Login failed.");
  setLoading(false);
  return;
}

      // Store the Sanctum token
      localStorage.setItem("auth_token", data.token);

      // Store user information
      localStorage.setItem("user", JSON.stringify(data.user));

      console.log("Login successful!");
      console.log("Token:", data.token);
      console.log("User:", data.user);

      // Redirect to home page
      navigate("/");
    } catch (error) {
  console.error("Backend connection error:", error);
  setError("Unable to connect to the server.");
  setLoading(false);
}
  };

  return (
    <AuthLayout
      title="Welcome Back."
      description="Sign in to continue to RentMyRide."
    >
      <AuthCard>

        <div className="auth-header">
          <h2>Login</h2>
          <p>Welcome back! Please sign in.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>

          <AuthInput
            id="email"
            type="email"
            label="Email"
            placeholder="example@email.com"
            value={formData.email}
            onChange={handleChange}
          />

          <PasswordInput
            id="password"
            label="Password"
            value={formData.password}
            onChange={handleChange}
          />

          <div className="forgot-password">
            <a href="/forgot-password">
              Forgot Password?
            </a>
          </div>

          {error && (
            <p className="auth-error">
              {error}
            </p>
          )}

          <SubmitButton text="Login" loading={loading} />

        </form>

        <SocialLogin />

        <AuthFooter
          text="Don't have an account?"
          linkText="Sign Up"
          link="/signup"
        />

      </AuthCard>
    </AuthLayout>
  );
}

export default LoginPage;