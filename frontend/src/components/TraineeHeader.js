import React from 'react';
import './Dashboard.css';


const TraineeHeader = ({ user, points, date }) => {
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
        <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '0.3rem 1.1rem',
              fontWeight: 700,
              fontSize: '1.08rem',
              border: '2px solid transparent',
              borderRadius: 12,
              background:
                'linear-gradient(#fff, #fff) padding-box, linear-gradient(90deg, #FF9100 0%, #FF4D8B 50%, #A855F7 100%) border-box',
              boxSizing: 'border-box',
              marginRight: 12,
            }}
          >
            <img
              src={process.env.PUBLIC_URL + '/Trophy.png'}
              alt="Trophy"
              style={{ width: 20, height: 20, marginRight: 4, verticalAlign: 'middle' }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: '1.08rem',
                background:
                  'linear-gradient(90deg, #FF9100 0%, #FF4D8B 50%, #A855F7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {points}pts
            </span>
          </div>
          <img
            src={user?.profile_image || user?.picture || '/user (1).png'}
            alt="avatar"
            style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',border:'2px solid #a855f7'}}
            onError={e => { e.target.onerror = null; e.target.src = '/user (1).png'; }}
          />
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
      </div>
    </header>
  );
};

export default TraineeHeader;
