// src/pages/AuthPages/components/PasswordInput.jsx

import { useState } from "react";

function PasswordInput({
  id,
  label,
  placeholder = "••••••••",
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-input-group">
      <label htmlFor={id}>{label}</label>

      <div className="password-wrapper">
        <input
          id={id}
          name={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
        />

        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

export default PasswordInput;