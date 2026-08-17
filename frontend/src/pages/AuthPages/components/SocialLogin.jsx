function SocialLogin() {
  return (
    <div className="social-login">
      <div className="social-divider">
        <span>or continue with</span>
      </div>

      <button type="button" className="google-button">
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
        />
        Continue with Google
      </button>
    </div>
  );
}

export default SocialLogin;