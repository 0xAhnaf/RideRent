import { useState } from "react";

function PasswordInput({
  id,
  label,
  placeholder = "••••••••",
  value,
  onChange,
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
          value={value}
          onChange={onChange}
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