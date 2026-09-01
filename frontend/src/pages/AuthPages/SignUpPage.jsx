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

function SignUpPage() {
  const navigate = useNavigate();

  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    password: "",
    confirmPassword: "",
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
  | Handle Registration
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    /*
    |--------------------------------------------------------------------------
    | Check Password Confirmation
    |--------------------------------------------------------------------------
    */

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        password: formData.password,
        password_confirmation:
          formData.confirmPassword,
      });

      /*
      |--------------------------------------------------------------------------
      | Registration Failed
      |--------------------------------------------------------------------------
      */

      if (!result.success) {
        const validationErrors =
          result.data?.errors;

        if (validationErrors) {
          const firstError = Object.values(
            validationErrors
          )[0]?.[0];

          setError(
            firstError ||
              result.data?.message ||
              "Registration failed."
          );
        } else {
          setError(
            result.data?.message ||
              "Registration failed."
          );
        }

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Registration Successful
      |--------------------------------------------------------------------------
      |
      | Backend automatically authenticates the new Renter.
      |
      */

      navigate("/", { replace: true });
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
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

          <p>
            Enter your details to get started.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <div className="auth-row">
            <AuthInput
              id="name"
              name="name"
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <AuthInput
              id="phone"
              name="phone"
              type="tel"
              label="Mobile Number"
              placeholder="017XXXXXXXX"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

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

          <AuthInput
            id="address"
            name="address"
            label="Residential Address"
            placeholder="Your address"
            value={formData.address}
            onChange={handleChange}
            required
          />

          <div className="auth-row">
            <PasswordInput
              id="password"
              name="password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          {error && (
            <p className="auth-error">
              {error}
            </p>
          )}

          <label className="terms">
            <input
              type="checkbox"
              required
            />

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