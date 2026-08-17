import "../../../styles/auth.css";
import "../../../styles/auth-responsive.css";
import logo from "../../../assets/logo_nobg.png"

function AuthLayout({ title, description, children }) {
  return (
    <div className="auth-page">
      <div className="auth-left">
        <img
          src={logo}
          alt="RentMyRide Logo"
          className="auth-logo"
        />

        <div className="auth-intro">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <div className="auth-security">
          <span>◇</span>

          <div>
            <strong>Secure & Verified</strong>
            <p>Your data is protected with enterprise-grade security.</p>
          </div>
        </div>
      </div>

      <div className="auth-right">
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;