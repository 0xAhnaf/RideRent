// src/pages/AuthPages/components/SubmitButton.jsx

function SubmitButton({ text, loading = false }) {
  return (
    <button
      type="submit"
      className="auth-button"
      disabled={loading}
    >
      {loading ? (
        <>
          <span className="loading-spinner"></span>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {text}
          <span>→</span>
        </>
      )}
    </button>
  );
}

export default SubmitButton;