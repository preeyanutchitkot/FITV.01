// src/components/InviteTrainee.js
import React, { useState } from 'react';

function InviteTrainee({ onInvite, onSuccess, endpoint = 'http://localhost:8000/invite' }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      setStatus('Please sign in again (missing token).');
      return;
    }
    if (!email.trim()) {
      setStatus('Please enter an email.');
      return;
    }

    setSending(true);
    setStatus('Sending...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email }),
      });

      // สำเร็จ (200/201/204)
      if (res.ok) {
        setStatus('Trainee invitation sent!');
        onInvite?.(email.trim());
        onSuccess?.();
        setEmail('');
        return;
      }

      // กรณี BE ส่งข้อความมา
      const data = await res.json().catch(() => ({}));

      // เผื่อกรณีตั้งใจทำ idempotent: เป็น trainee อยู่แล้วแต่ถือว่าสำเร็จ
      if (res.status === 200 || data?.detail?.toLowerCase?.().includes('already')) {
        setStatus(data.detail || 'Already invited / mapping ensured');
        onSuccess?.();
      } else if (res.status === 401) {
        setStatus(`Unauthorized: ${data.detail || 'Please sign in again.'}`);
      } else {
        setStatus(`Failed: ${data.detail || 'Unknown error'}`);
      }
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <input
        type="email"
        placeholder="Type an email to invite"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={sending}
        style={{
          flex: 1,
          padding: 10,
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          fontSize: 15,
          outline: 'none',
        }}
      />
      <button
        type="submit"
        disabled={sending}
        style={{
          background: 'linear-gradient(90deg, #ff5c8d 0%, #a259ff 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '0 18px',
          fontWeight: 600,
          fontSize: 15,
          cursor: sending ? 'not-allowed' : 'pointer',
          height: 40,
          opacity: sending ? 0.8 : 1,
        }}
      >
        {sending ? 'Sending…' : '+ Invite'}
      </button>
      {status && (
        <span style={{ marginLeft: 8, color: '#475569', fontSize: 13 }}>
          {status}
        </span>
      )}
    </form>
  );
}

export default InviteTrainee;
