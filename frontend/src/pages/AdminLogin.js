

import React, { useState } from 'react';
import '../pages/HomePage.css';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8000/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('admin_token', data.token);
        window.location.href = '/admin';
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="fitaddict-bg" style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{
        width: 400,
        background: '#fff',
        borderRadius: 24,
        boxShadow: '0 6px 24px -4px rgba(99,102,241,0.10), 0 1.5px 6px 0 rgba(168,85,247,0.08)',
        padding: '2.5rem 2rem',
        position: 'relative',
        border: '1.5px solid #e0e7ff'
      }}>
        <div style={{
          position: 'absolute',
          top: -32,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#fff',
          borderRadius: '50%',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
     
        }}>
     
        </div>
        <h2 style={{textAlign:'center',background:'linear-gradient(90deg,#7c3aed 0%,#a21caf 50%,#a855f7 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',fontWeight:900,marginBottom:'2.2rem',marginTop:40,letterSpacing:1}}>Admin Login</h2>
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:22,display:'flex',flexDirection:'column',gap:0}}>
            <label style={{fontWeight:700,display:'block',marginBottom:6,color:'#6366f1',fontSize:'1.08rem'}}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e=>setUsername(e.target.value)}
              required
              className="fitaddict-input"
              style={{
                width:'100%',
                height:'48px',
                padding:'0 1rem',
                borderRadius:14,
                border:'1.5px solid #a855f7',
                fontSize:'1.12rem',
                background:'#f8fafc',
                boxSizing:'border-box',
                marginBottom:0,
                fontWeight:500
              }}
            />
          </div>
          <div style={{marginBottom:22,display:'flex',flexDirection:'column',gap:0}}>
            <label style={{fontWeight:700,display:'block',marginBottom:6,color:'#6366f1',fontSize:'1.08rem'}}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              required
              className="fitaddict-input"
              style={{
                width:'100%',
                height:'48px',
                padding:'0 1rem',
                borderRadius:14,
                border:'1.5px solid #a855f7',
                fontSize:'1.12rem',
                background:'#f8fafc',
                boxSizing:'border-box',
                marginBottom:0,
                fontWeight:500
              }}
            />
          </div>
          {/* คำแนะนำถูกลบตามคำขอ */}
          {error && <div style={{color:'#ef4444',marginBottom:16,fontWeight:600,textAlign:'center'}}>{typeof error === 'string' ? error : (error.message || 'เกิดข้อผิดพลาด')}</div>}
          <button type="submit" disabled={loading} className="fitaddict-btn" style={{width:'100%',background:'linear-gradient(90deg,#a855f7 0%,#7c3aed 100%)',color:'#fff',fontWeight:800,padding:'1rem',border:'none',borderRadius:16,fontSize:'1.12rem',cursor:'pointer',boxShadow:'0 2px 8px #a855f722',letterSpacing:1}}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
