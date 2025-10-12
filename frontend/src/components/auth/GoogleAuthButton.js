
import React, { useEffect, useRef } from 'react';
import './GoogleAuthButton.css';

const GoogleAuthButton = ({ onSuccess, onError }) => {
  const buttonDiv = useRef(null);

  useEffect(() => {
    if (!window.google || !window.google.accounts || !window.google.accounts.id) return;
    if (buttonDiv.current) buttonDiv.current.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
      callback: (response) => {
        if (response && response.credential) {
          onSuccess({ credential: response.credential });
        } else {
          onError && onError();
        }
      },
      ux_mode: 'popup',
    });
    window.google.accounts.id.renderButton(buttonDiv.current, {
      theme: 'outline',
      size: 'large',
      width: 320,
      text: 'continue_with',
      logo_alignment: 'left',
      shape: 'pill',
    });
  }, [onSuccess, onError]);

  return (
    <div className="google-auth-button">
      <div ref={buttonDiv} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} />
    </div>
  );
};

export default GoogleAuthButton;
