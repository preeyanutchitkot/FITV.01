import React from "react";
import "./LoginCard.css";

const LoginCard = ({ onGoogleClick }) => (
  <div className="login-card-container">
    <div className="login-card">
      <img
        src="/Logo_FitAddicttest.png"
        alt="App Logo"
        className="login-card-logo"
      />
      <h1 className="login-card-title">Sign In</h1>
      <p className="login-card-subtitle">
        Sign In with your Google account to access FueRify’s powerful features
      </p>
      <button
        type="button"
        className="login-card-google-btn"
        aria-label="Continue with Google"
        onClick={onGoogleClick}
      >
        <img
          src="/googlelogo.png"
          alt="Google logo"
          className="login-card-google-icon"
        />
        <span className="login-card-google-text">Continue with Google</span>
      </button>
      <div className="login-card-divider">
        <span className="login-card-divider-line" />
        <span className="login-card-divider-text">Secure &amp; Fast</span>
        <span className="login-card-divider-line" />
      </div>
      <div className="login-card-footer">
        <img
          src="/lock-icon.svg"
          alt="Shield icon"
          className="login-card-shield"
        />
        <span className="login-card-footer-text">
          Secure authentication powered by Google
        </span>
      </div>
    </div>
  </div>
);

export default LoginCard;
