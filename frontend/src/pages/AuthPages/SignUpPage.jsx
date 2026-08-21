// src/pages/AuthPages/SignUpPage.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthLayout from "./components/AuthLayout";
import AuthCard from "./components/AuthCard";
import AuthInput from "./components/AuthInput";
import PasswordInput from "./components/PasswordInput";
import SubmitButton from "./components/SubmitButton";
import SocialLogin from "./components/SocialLogin";
import AuthFooter from "./components/AuthFooter";

function SignUpPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    setError("");

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      console.log("Registration response:", data);

      if (!response.ok) {
        setError(data.message || "Registration failed.");
        setLoading(false);
        return;
      }

      // Store Sanctum token
      localStorage.setItem("auth_token", data.token);

      // Store user information
      localStorage.setItem("user", JSON.stringify(data.user));

      console.log("Registration successful!");
      console.log("Token:", data.token);
      console.log("User:", data.user);

      // Go to home page
      navigate("/");
    } catch (error) {
      console.error("Backend connection error:", error);
      setError("Unable to connect to the server.");
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Join RentMyRide."
      description="Create an account and make your next journey easier."
    >
      <AuthCard>

        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Enter your details to get started.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>

          <div className="auth-row">

            <AuthInput
              id="name"
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
            />

            <AuthInput
              id="mobile"
              type="tel"
              label="Mobile Number"
              placeholder="+880 1XXXXXXXXX"
            />

          </div>

          <AuthInput
            id="email"
            type="email"
            label="Email"
            placeholder="example@email.com"
            value={formData.email}
            onChange={handleChange}
          />

          <AuthInput
            id="address"
            label="Residential Address"
            placeholder="Your address"
          />

          <div className="auth-row">

            <PasswordInput
              id="password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
            />

            <PasswordInput
              id="confirmPassword"
              label="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />

          </div>

          {error && (
            <p className="auth-error">
              {error}
            </p>
          )}

          <label className="terms">
            <input type="checkbox" />

            <span>
              I agree to the{" "}
              <a href="#">Terms of Service</a>{" "}
              and{" "}
              <a href="#">Privacy Policy</a>.
            </span>
          </label>

          <SubmitButton
            text="Create Account"
            loading={loading}
          />

        </form>

        <SocialLogin />

        <AuthFooter
          text="Already have an account?"
          linkText="Login"
          link="/login"
        />

      </AuthCard>
    </AuthLayout>
  );
}

export default SignUpPage;