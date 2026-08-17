// src/pages/AuthPages/SignUpPage.jsx

import AuthLayout from "./components/AuthLayout";
import AuthCard from "./components/AuthCard";
import AuthInput from "./components/AuthInput";
import PasswordInput from "./components/PasswordInput";
import SubmitButton from "./components/SubmitButton";
import SocialLogin from "./components/SocialLogin";
import AuthFooter from "./components/AuthFooter";

function SignUpPage() {
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

        <form className="auth-form">

          <div className="auth-row">

            <AuthInput
              id="fullName"
              label="Full Name"
              placeholder="John Doe"
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
            />

            <PasswordInput
              id="confirmPassword"
              label="Confirm Password"
            />

          </div>

          <label className="terms">
            <input type="checkbox" />

            <span>
              I agree to the{" "}
              <a href="#">Terms of Service</a>{" "}
              and{" "}
              <a href="#">Privacy Policy</a>.
            </span>
          </label>

          <SubmitButton text="Create Account" />

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