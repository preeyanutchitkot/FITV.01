import React from 'react';
import './Dashboard.css';


const TrainerHeader = ({ user, date }) => {
  const handleSignOut = () => {
    if (window.confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };
  return (
    <header className="trainee-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#fff',padding:'1rem 2rem',borderRadius:'0 0 24px 24px',boxShadow:'0 2px 8px -2px #a855f722',marginBottom:'1.5rem'}}>
      <div style={{fontWeight:900,fontSize:'2rem',color:'#a855f7',letterSpacing:'-0.03em'}}>FitAddict</div>
      <div style={{display:'flex',alignItems:'center',gap:'2rem'}}>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:'1rem',color:'#334155'}}>Hi {user?.name || ''}</div>
          <div style={{fontSize:'0.95rem',color:'#64748b'}}>{date}</div>
        </div>
  <img src={user?.picture || `/user (1).png`} alt="avatar" style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',border:'2px solid #a855f7'}} />
        <button
          onClick={handleSignOut}
          style={{
            marginLeft: 16,
            padding: '0.4rem 1.1rem',
            background: '#fff',
            color: '#a855f7',
            fontWeight: 700,
            border: 'none',
            borderRadius: 18,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 2px 12px #a855f733',
            transition: 'background 0.18s, color 0.18s',
          }}
        >
          ออกจากระบบ
        </button>
      </div>
    </header>
  );
};

export default TrainerHeader;
