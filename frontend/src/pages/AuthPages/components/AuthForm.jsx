// src/pages/AuthPages/components/AuthForm.jsx

function AuthForm({ title, subtitle, children, buttonText, footer }) {
  return (
    <div className="auth-form-wrapper">

      <div className="auth-header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <form className="auth-form">
        {children}

        <button type="submit" className="auth-button">
          {buttonText}
          <span>→</span>
        </button>
      </form>

      <div className="auth-footer">
        {footer}
      </div>

    </div>
  );
}

export default AuthForm;