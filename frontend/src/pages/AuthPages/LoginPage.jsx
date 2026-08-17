// src/pages/AuthPages/LoginPage.jsx

import AuthLayout from "./components/AuthLayout";
import AuthCard from "./components/AuthCard";
import AuthInput from "./components/AuthInput";
import PasswordInput from "./components/PasswordInput";
import SubmitButton from "./components/SubmitButton";
import SocialLogin from "./components/SocialLogin";
import AuthFooter from "./components/AuthFooter";

function LoginPage() {
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

        <form className="auth-form">

          <AuthInput
            id="email"
            type="email"
            label="Email"
            placeholder="example@email.com"
          />

          <PasswordInput
            id="password"
            label="Password"
          />

          <div className="forgot-password">
            <a href="/forgot-password">
              Forgot Password?
            </a>
          </div>

          <SubmitButton text="Login" />

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