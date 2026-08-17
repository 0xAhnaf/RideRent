// src/pages/AuthPages/components/SubmitButton.jsx

function SubmitButton({ text }) {
  return (
    <button type="submit" className="auth-button">
      {text}
      <span>→</span>
    </button>
  );
}

export default SubmitButton;