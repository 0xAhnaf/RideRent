// src/pages/AuthPages/components/AuthInput.jsx

function AuthInput({
  id,
  type = "text",
  label,
  placeholder,
  value,
  onChange,
}) {
  return (
    <div className="auth-input-group">
      <label htmlFor={id}>{label}</label>

      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export default AuthInput;