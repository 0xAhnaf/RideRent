import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthLayout from "./components/AuthLayout";
import AuthCard from "./components/AuthCard";
import AuthInput from "./components/AuthInput";
import PasswordInput from "./components/PasswordInput";
import SubmitButton from "./components/SubmitButton";
import SocialLogin from "./components/SocialLogin";
import AuthFooter from "./components/AuthFooter";

import { useAuth } from "../../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();

  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Handle Input Changes
  |--------------------------------------------------------------------------
  */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Handle Login
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    setLoading(true);

    try {
      const result = await login(
        formData.email,
        formData.password
      );

      /*
      |--------------------------------------------------------------------------
      | Login Failed
      |--------------------------------------------------------------------------
      */

      if (!result.success) {
        const validationErrors = result.data?.errors;

        if (validationErrors?.email?.length) {
          setError(validationErrors.email[0]);
        } else {
          setError(
            result.data?.message ||
              "Invalid email or password."
          );
        }

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Login Successful
      |--------------------------------------------------------------------------
      |
      | The authentication session is now handled by Laravel.
      |
      | No localStorage.
      |
      */

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Login error:", error);

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
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

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <AuthInput
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="example@email.com"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <PasswordInput
            id="password"
            name="password"
            label="Password"
            value={formData.password}
            onChange={handleChange}
            required
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

          <SubmitButton
            text="Login"
            loading={loading}
          />
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