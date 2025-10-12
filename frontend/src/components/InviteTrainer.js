import React, { useState } from 'react';


function InviteTrainer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');
    try {
      const res = await fetch('http://localhost:8000/invite-trainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('Trainer invitation sent!');
        setEmail('');
      } else {
        const data = await res.json();
        setStatus(`Failed: ${data.detail || 'Unknown error'}`);
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const containerStyle = {
    background: '#fff',
    maxWidth: 400,
    margin: '3rem auto',
    padding: '2rem',
    borderRadius: '1.5rem',
    boxShadow: '0 2px 16px rgba(0, 0, 0, 0.06)',
    textAlign: 'center',
  };
  const h2Style = {
    color: '#4f46e5',
    fontSize: '1.8rem',
    marginBottom: '1rem',
  };
  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  };
  const inputStyle = {
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #cbd5e1',
    borderRadius: '0.75rem',
  };
  const buttonStyle = {
    background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)',
    color: '#fff',
    padding: '0.75rem',
    fontSize: '1rem',
    border: 'none',
    borderRadius: '2rem',
    cursor: 'pointer',
    transition: '0.2s ease-in-out',
  };
  const buttonHoverStyle = {
    background: 'linear-gradient(90deg, #818cf8 0%, #6366f1 100%)',
    transform: 'scale(1.03)',
  };
  const statusStyle = {
    marginTop: '1rem',
    color: '#475569',
  };

  return (
    <div style={containerStyle}>
      <h2 style={h2Style}>Invite Trainer</h2>
      <form onSubmit={handleSubmit} style={formStyle}>
        <input
          type="email"
          placeholder="Enter trainer's email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <button
          type="submit"
          style={buttonStyle}
          onMouseOver={e => { e.currentTarget.style.background = buttonHoverStyle.background; e.currentTarget.style.transform = buttonHoverStyle.transform; }}
          onMouseOut={e => { e.currentTarget.style.background = buttonStyle.background; e.currentTarget.style.transform = ''; }}
        >
          Send Invite
        </button>
      </form>
      {status && <p style={statusStyle}>{status}</p>}
    </div>
  );
}

export default InviteTrainer;
