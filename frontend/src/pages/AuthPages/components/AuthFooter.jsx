// src/pages/AuthPages/components/AuthFooter.jsx

function AuthFooter({ text, linkText, link }) {
  return (
    <div className="auth-footer">
      {text}{" "}
      <a href={link}>{linkText}</a>
    </div>
  );
}

export default AuthFooter;