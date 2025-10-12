import React, { useState } from 'react';
import InviteTrainee from '../components/InviteTrainee';

// Inline InviteTrainer logic here
function InviteTrainerInline({ onInvite }) {
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
        if (onInvite) onInvite(email);
      } else {
        const data = await res.json();
        setStatus(`Failed: ${data.detail || 'Unknown error'}`);
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <input
        type="email"
        placeholder="Type an email to invite"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 15 }}
      />
      <button
        type="submit"
        style={{ background: 'linear-gradient(90deg, #ff5c8d 0%, #a259ff 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '0 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', height: 40 }}
      >
        + Invite
      </button>
      {status && <span style={{ marginLeft: 8, color: '#475569', fontSize: 13 }}>{status}</span>}
    </form>
  );
}
const mockMembers = [
  { name: 'Asia FitAddict', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', online: true },
  { name: 'Few FitAddict', avatar: 'https://randomuser.me/api/portraits/men/33.jpg', online: true },
  { name: 'P FitAddict', avatar: 'https://randomuser.me/api/portraits/men/34.jpg', online: true },
  { name: 'Nick FitAddict', avatar: 'https://randomuser.me/api/portraits/men/35.jpg', online: true },
  { name: 'Plume FitAddict', avatar: 'https://randomuser.me/api/portraits/men/36.jpg', online: true },
  { name: 'Plume FitAddict', avatar: 'https://randomuser.me/api/portraits/men/37.jpg', online: true },
  { name: 'Plume FitAddict', avatar: 'https://randomuser.me/api/portraits/men/38.jpg', online: true },
  { name: 'Plume FitAddict', avatar: 'https://randomuser.me/api/portraits/men/39.jpg', online: true },
  { name: 'Plume FitAddict', avatar: 'https://randomuser.me/api/portraits/men/40.jpg', online: true },
  { name: 'Plume FitAddict', avatar: 'https://randomuser.me/api/portraits/men/41.jpg', online: true },
  { name: 'Plume FitAddict', avatar: 'https://randomuser.me/api/portraits/men/42.jpg', online: true },
  { name: 'Plume FitAddict', avatar: 'https://randomuser.me/api/portraits/men/43.jpg', online: true },
];

function AdminPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fafbfc' }}>
      {/* Sidebar */}
      <div style={{ width: 320, background: '#fff', borderRight: '1px solid #e5e7eb', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <img src="https://randomuser.me/api/portraits/men/31.jpg" alt="admin" style={{ width: 48, height: 48, borderRadius: '50%' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Panithan FitAddict</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Usage period <b>Aug 01 - Sep 01</b> Resets in 27 days</div>
          </div>
        </div>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Memberlist ({mockMembers.length})</div>
  <InviteTrainerInline />
  <InviteTrainee />
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 8 }}>
          {mockMembers.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <img src={m.avatar} alt={m.name} style={{ width: 36, height: 36, borderRadius: '50%' }} />
              <div style={{ flex: 1, fontSize: 15 }}>{m.name}</div>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: m.online ? '#22c55e' : '#e5e7eb', display: 'inline-block' }}></span>
              <span style={{ color: '#64748b', fontSize: 20, cursor: 'pointer' }}>⋮</span>
            </div>
          ))}
        </div>
      </div>
      {/* Main content placeholder */}
      <div style={{ flex: 1, padding: 32 }}>
        <h1 style={{ fontWeight: 700, fontSize: 28, marginBottom: 16 }}>หน้าผู้ดูแลระบบ (Admin)</h1>
        <p style={{ fontSize: 17, color: '#64748b' }}>ยินดีต้อนรับสู่หน้าสำหรับผู้ดูแลระบบ!</p>
      </div>
    </div>
  );
}

export default AdminPage;
